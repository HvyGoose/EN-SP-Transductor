from datetime import datetime, timezone
import uuid

from fastapi import HTTPException
from emergentintegrations.payments.stripe.checkout import CheckoutSessionRequest, StripeCheckout


def build_webhook_url(base_url):
    host_url = str(base_url).rstrip('/')
    return f'{host_url}/api/webhook/stripe'


async def create_checkout_session(db, api_key, origin_url, request_base_url, email, premium_price, logger):
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=build_webhook_url(request_base_url))
    checkout_request = CheckoutSessionRequest(
        amount=premium_price,
        currency='usd',
        success_url=f'{origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}',
        cancel_url=f'{origin_url}/',
        metadata={'product': 'translator_premium', 'email': email or 'anonymous'}
    )
    session = await stripe_checkout.create_checkout_session(checkout_request)

    await db.payment_transactions.insert_one({
        'id': str(uuid.uuid4()),
        'session_id': session.session_id,
        'email': email,
        'amount': premium_price,
        'currency': 'usd',
        'product': 'translator_premium',
        'payment_status': 'pending',
        'created_at': datetime.now(timezone.utc).isoformat(),
    })
    logger.info(f'Checkout session created: {session.session_id}')
    return {'checkout_url': session.url, 'session_id': session.session_id}


async def get_checkout_status(db, api_key, session_id, request_base_url, logger):
    try:
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=build_webhook_url(request_base_url))
        status = await stripe_checkout.get_checkout_status(session_id)
        update_data = {
            'payment_status': status.payment_status,
            'status': status.status,
            'updated_at': datetime.now(timezone.utc).isoformat(),
        }

        if status.payment_status == 'paid':
            transaction = await db.payment_transactions.find_one({'session_id': session_id})
            if transaction and transaction.get('payment_status') != 'paid':
                email = transaction.get('email') or status.metadata.get('email')
                if email and email != 'anonymous':
                    await db.premium_users.update_one(
                        {'email': email},
                        {'$set': {
                            'email': email,
                            'is_premium': True,
                            'activated_at': datetime.now(timezone.utc).isoformat(),
                            'session_id': session_id,
                        }},
                        upsert=True,
                    )
                    logger.info(f'Premium activated for: {email}')

        await db.payment_transactions.update_one({'session_id': session_id}, {'$set': update_data})
        return {
            'status': status.status,
            'payment_status': status.payment_status,
            'amount': status.amount_total / 100,
            'currency': status.currency,
        }
    except Exception as error:
        logger.error(f'Get payment status error: {error}')
        error_str = str(error).lower()
        if 'resource' in error_str or 'not found' in error_str or 'invalid' in error_str or 'no such' in error_str:
            raise HTTPException(status_code=404, detail='Session not found')
        raise HTTPException(status_code=500, detail=str(error))


async def check_premium_status(db, email):
    user = await db.premium_users.find_one({'email': email.lower()}, {'_id': 0})
    return {'is_premium': bool(user and user.get('is_premium')), 'email': email}


async def process_stripe_webhook(db, api_key, request_base_url, body, signature, logger):
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=build_webhook_url(request_base_url))
    webhook_response = await stripe_checkout.handle_webhook(body, signature)
    logger.info(f'Webhook received: {webhook_response.event_type}, session: {webhook_response.session_id}')

    if webhook_response.session_id:
        await db.payment_transactions.update_one(
            {'session_id': webhook_response.session_id},
            {'$set': {
                'payment_status': webhook_response.payment_status,
                'webhook_event': webhook_response.event_type,
                'updated_at': datetime.now(timezone.utc).isoformat(),
            }}
        )

    return {'received': True}