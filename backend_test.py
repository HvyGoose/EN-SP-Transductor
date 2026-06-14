import requests
import sys
import json
import base64
import io
from datetime import datetime

class TranslatorAPITester:
    def __init__(self, base_url="https://bilingual-voice-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_translation_en_to_es(self):
        """Test English to Spanish translation"""
        try:
            payload = {
                "text": "Hello, how are you?",
                "source_lang": "en",
                "target_lang": "es"
            }
            response = requests.post(f"{self.api_url}/translate", json=payload, timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                translated = data.get('translated_text', '')
                details += f", Translation: '{translated}'"
                # Check if translation looks reasonable (contains Spanish words)
                if len(translated) > 0 and translated != payload['text']:
                    success = True
                else:
                    success = False
                    details += " (Translation appears invalid)"
            
            self.log_test("Translation EN→ES", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Translation EN→ES", False, str(e))
            return False, {}

    def test_translation_es_to_en(self):
        """Test Spanish to English translation"""
        try:
            payload = {
                "text": "Hola, ¿cómo estás?",
                "source_lang": "es", 
                "target_lang": "en"
            }
            response = requests.post(f"{self.api_url}/translate", json=payload, timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                translated = data.get('translated_text', '')
                details += f", Translation: '{translated}'"
                # Check if translation looks reasonable
                if len(translated) > 0 and translated != payload['text']:
                    success = True
                else:
                    success = False
                    details += " (Translation appears invalid)"
            
            self.log_test("Translation ES→EN", success, details)
            return success, response.json() if success else {}
        except Exception as e:
            self.log_test("Translation ES→EN", False, str(e))
            return False, {}

    def test_translation_empty_text(self):
        """Test translation with empty text"""
        try:
            payload = {
                "text": "",
                "source_lang": "en",
                "target_lang": "es"
            }
            response = requests.post(f"{self.api_url}/translate", json=payload, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                translated = data.get('translated_text', '')
                # Empty text should return empty translation
                if translated == "":
                    success = True
                    details += ", Empty text handled correctly"
                else:
                    success = False
                    details += f", Expected empty, got: '{translated}'"
            
            self.log_test("Translation Empty Text", success, details)
            return success
        except Exception as e:
            self.log_test("Translation Empty Text", False, str(e))
            return False

    def test_text_to_speech(self):
        """Test text-to-speech endpoint"""
        try:
            payload = {
                "text": "Hello world",
                "lang": "en"
            }
            response = requests.post(f"{self.api_url}/text-to-speech", json=payload, timeout=30)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                audio_data = data.get('audio', '')
                audio_format = data.get('format', '')
                details += f", Format: {audio_format}, Audio length: {len(audio_data)} chars"
                
                # Validate base64 audio data
                try:
                    base64.b64decode(audio_data)
                    success = True
                    details += " (Valid base64 audio)"
                except:
                    success = False
                    details += " (Invalid base64 audio)"
            
            self.log_test("Text-to-Speech", success, details)
            return success
        except Exception as e:
            self.log_test("Text-to-Speech", False, str(e))
            return False

    def test_text_to_speech_empty(self):
        """Test text-to-speech with empty text"""
        try:
            payload = {
                "text": "",
                "lang": "en"
            }
            response = requests.post(f"{self.api_url}/text-to-speech", json=payload, timeout=10)
            # Should return 400 for empty text
            success = response.status_code == 400
            details = f"Status: {response.status_code} (Expected 400 for empty text)"
            
            self.log_test("Text-to-Speech Empty", success, details)
            return success
        except Exception as e:
            self.log_test("Text-to-Speech Empty", False, str(e))
            return False

    def test_speech_to_text_no_audio(self):
        """Test speech-to-text endpoint without audio - should fail appropriately"""
        try:
            # Send request without audio file
            response = requests.post(f"{self.api_url}/speech-to-text", timeout=10)
            # Should return 422 (Unprocessable Entity) for missing required field
            success = response.status_code == 422
            details = f"Status: {response.status_code} (Expected 422 for missing audio)"
            
            if not success and response.status_code == 400:
                # 400 is also acceptable for bad request
                success = True
                details = f"Status: {response.status_code} (400 Bad Request is acceptable)"
            
            self.log_test("Speech-to-Text No Audio", success, details)
            return success
        except Exception as e:
            self.log_test("Speech-to-Text No Audio", False, str(e))
            return False

    def test_check_premium_unknown_email(self):
        """Test check-premium endpoint with unknown email"""
        try:
            payload = {
                "email": "unknown_user_12345@example.com"
            }
            response = requests.post(f"{self.api_url}/payments/check-premium", json=payload, timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                is_premium = data.get('is_premium', None)
                email = data.get('email', '')
                details += f", is_premium: {is_premium}, email: {email}"
                
                # Unknown email should return is_premium: false
                if is_premium == False:
                    success = True
                    details += " (Correctly returned false for unknown email)"
                else:
                    success = False
                    details += f" (Expected is_premium=false, got {is_premium})"
            
            self.log_test("Check Premium Unknown Email", success, details)
            return success
        except Exception as e:
            self.log_test("Check Premium Unknown Email", False, str(e))
            return False

    def test_translation_history(self):
        """Test translation history endpoint"""
        try:
            response = requests.get(f"{self.api_url}/history", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                data = response.json()
                details += f", History entries: {len(data)}"
                # Check if it's a list
                if isinstance(data, list):
                    success = True
                else:
                    success = False
                    details += " (Expected list format)"
            
            self.log_test("Translation History", success, details)
            return success
        except Exception as e:
            self.log_test("Translation History", False, str(e))
            return False

    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting API tests for {self.base_url}")
        print("=" * 60)
        
        # Test basic connectivity first
        if not self.test_api_root():
            print("❌ API root failed - stopping tests")
            return False
        
        # Test translation endpoints
        self.test_translation_en_to_es()
        self.test_translation_es_to_en()
        self.test_translation_empty_text()
        
        # Test audio endpoints
        self.test_text_to_speech()
        self.test_text_to_speech_empty()
        self.test_speech_to_text_no_audio()
        
        # Test payment endpoints
        self.test_check_premium_unknown_email()
        
        # Test history
        self.test_translation_history()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = TranslatorAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())