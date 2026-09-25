from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import User


class AccountsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.me_url = reverse('auth-me')

        self.user_data = {
            'name': 'Aarav Sharma',
            'email': 'aarav.sharma@example.gov.in',
            'phone_number': '+91 9876543210',
            'password': 'SecureCitizenPassword123!'
        }

    def test_custom_user_creation_and_hashing(self):
        """Verify custom user model stores only name, email, phone_number and hashes password natively"""
        user = User.objects.create_user(
            email='test@example.com',
            name='Test Citizen',
            phone_number='1234567890',
            password='SecretPassword123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.name, 'Test Citizen')
        self.assertEqual(user.phone_number, '1234567890')
        self.assertTrue(user.check_password('SecretPassword123'))
        self.assertFalse(user.check_password('WrongPassword'))
        self.assertNotEqual(user.password, 'SecretPassword123')  # Securely hashed

    def test_user_registration_api(self):
        """Test POST /api/auth/register/"""
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertEqual(response.data['user']['email'], self.user_data['email'])

    def test_user_login_api_success(self):
        """Test POST /api/auth/login/ with valid credentials"""
        User.objects.create_user(**self.user_data)
        response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['name'], 'Aarav Sharma')

    def test_user_login_api_invalid_credentials(self):
        """Test POST /api/auth/login/ with wrong password returns clear error"""
        User.objects.create_user(**self.user_data)
        response = self.client.post(self.login_url, {
            'email': self.user_data['email'],
            'password': 'IncorrectPassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
        self.assertIn('Invalid email or password', str(response.data))

    def test_user_login_api_nonexistent_account(self):
        """Test POST /api/auth/login/ with nonexistent email returns clear error"""
        response = self.client.post(self.login_url, {
            'email': 'nonexistent@example.com',
            'password': 'SomePassword'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', response.data)
        self.assertIn('Invalid email or password', str(response.data))
