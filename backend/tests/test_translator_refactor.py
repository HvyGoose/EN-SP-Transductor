"""
Backend API tests for translator app after major refactor.
Tests: /api/translate, /api/speech-to-text, /api/text-to-speech, /api/payments/check-premium
"""
import os
import pytest
import requests
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndRoot:
    """Basic health check tests"""
    
    def test_root_endpoint(self):
        """Test root API endpoint returns expected message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Translator" in data["message"]
        print(f"SUCCESS: Root endpoint returns: {data['message']}")


class TestTranslationEndpoint:
    """Tests for /api/translate endpoint"""
    
    def test_translate_english_to_spanish(self):
        """Test basic English to Spanish translation"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Hello, how are you?",
            "source_lang": "en",
            "target_lang": "es"
        })
        assert response.status_code == 200
        data = response.json()
        assert "translated_text" in data
        assert "original_text" in data
        assert data["original_text"] == "Hello, how are you?"
        assert data["source_lang"] == "en"
        assert data["target_lang"] == "es"
        assert len(data["translated_text"]) > 0
        print(f"SUCCESS: Translated 'Hello, how are you?' to: {data['translated_text']}")
    
    def test_translate_spanish_to_english(self):
        """Test Spanish to English translation"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "Buenos días",
            "source_lang": "es",
            "target_lang": "en"
        })
        assert response.status_code == 200
        data = response.json()
        assert "translated_text" in data
        assert len(data["translated_text"]) > 0
        print(f"SUCCESS: Translated 'Buenos días' to: {data['translated_text']}")
    
    def test_translate_empty_text(self):
        """Test translation with empty text returns empty translation"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "",
            "source_lang": "en",
            "target_lang": "es"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["translated_text"] == ""
        print("SUCCESS: Empty text returns empty translation")
    
    def test_translate_whitespace_only(self):
        """Test translation with whitespace only"""
        response = requests.post(f"{BASE_URL}/api/translate", json={
            "text": "   ",
            "source_lang": "en",
            "target_lang": "es"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["translated_text"] == ""
        print("SUCCESS: Whitespace-only text returns empty translation")


class TestTextToSpeechEndpoint:
    """Tests for /api/text-to-speech endpoint"""
    
    def test_tts_english(self):
        """Test text-to-speech for English text"""
        response = requests.post(f"{BASE_URL}/api/text-to-speech", json={
            "text": "Hello world",
            "lang": "en"
        })
        assert response.status_code == 200
        data = response.json()
        assert "audio" in data
        assert "format" in data
        assert data["format"] == "mp3"
        assert len(data["audio"]) > 100  # Base64 audio should be substantial
        print(f"SUCCESS: TTS returned audio (base64 length: {len(data['audio'])})")
    
    def test_tts_spanish(self):
        """Test text-to-speech for Spanish text"""
        response = requests.post(f"{BASE_URL}/api/text-to-speech", json={
            "text": "Hola mundo",
            "lang": "es"
        })
        assert response.status_code == 200
        data = response.json()
        assert "audio" in data
        assert len(data["audio"]) > 100
        print(f"SUCCESS: TTS Spanish returned audio (base64 length: {len(data['audio'])})")
    
    def test_tts_empty_text_fails(self):
        """Test TTS with empty text returns 400"""
        response = requests.post(f"{BASE_URL}/api/text-to-speech", json={
            "text": "",
            "lang": "en"
        })
        assert response.status_code == 400
        print("SUCCESS: TTS with empty text returns 400")


class TestSpeechToTextEndpoint:
    """Tests for /api/speech-to-text endpoint"""
    
    def test_stt_requires_audio_file(self):
        """Test STT endpoint requires audio file"""
        response = requests.post(f"{BASE_URL}/api/speech-to-text")
        assert response.status_code == 422  # Validation error - missing file
        print("SUCCESS: STT requires audio file (422 on missing)")
    
    def test_stt_with_small_audio_fails(self):
        """Test STT with too-small audio returns error"""
        # Create a minimal audio file (too small to be valid)
        small_audio = io.BytesIO(b"RIFF" + b"\x00" * 100)
        small_audio.name = "test.webm"
        
        response = requests.post(
            f"{BASE_URL}/api/speech-to-text",
            files={"audio": ("test.webm", small_audio, "audio/webm")},
            data={"language": "en"}
        )
        # Should return 400 for audio too short
        assert response.status_code in [400, 422, 500]
        print(f"SUCCESS: STT with small audio returns error (status: {response.status_code})")


class TestPaymentsEndpoint:
    """Tests for /api/payments/check-premium endpoint"""
    
    def test_check_premium_unknown_email(self):
        """Test check-premium returns false for unknown email"""
        response = requests.post(f"{BASE_URL}/api/payments/check-premium", json={
            "email": "TEST_unknown_user@example.com"
        })
        assert response.status_code == 200
        data = response.json()
        assert "is_premium" in data
        assert data["is_premium"] == False
        assert data["email"] == "TEST_unknown_user@example.com"
        print("SUCCESS: check-premium returns is_premium=false for unknown email")
    
    def test_check_premium_missing_email(self):
        """Test check-premium requires email"""
        response = requests.post(f"{BASE_URL}/api/payments/check-premium", json={})
        assert response.status_code == 422
        print("SUCCESS: check-premium requires email (422 on missing)")


class TestHistoryEndpoint:
    """Tests for /api/history endpoint"""
    
    def test_get_history(self):
        """Test getting translation history"""
        response = requests.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"SUCCESS: History endpoint returns list with {len(data)} entries")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
