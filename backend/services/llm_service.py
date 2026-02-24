"""
LLM Service
Abstraction layer for calling OpenAI's GPT models.
Supports: gpt-3.5-turbo, gpt-4
Fallback: Local mock for demo/testing without API key.
"""

import logging
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """
    LLM client abstraction. Calls OpenAI API or falls back to a
    deterministic demo mode if no API key is configured.
    """

    def __init__(self):
        self.model = settings.LLM_MODEL
        self.max_tokens = settings.LLM_MAX_TOKENS
        self.temperature = settings.LLM_TEMPERATURE
        self._client = None

        if settings.OPENAI_API_KEY:
            try:
                from openai import AsyncOpenAI
                self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info(f"OpenAI client initialized. Model: {self.model}")
            except ImportError:
                logger.warning("openai package not installed. Using demo mode.")
        else:
            logger.warning("No OPENAI_API_KEY set. Using demo/mock LLM mode.")

    async def generate(self, prompt: str) -> str:
        """
        Generate a response from the LLM given a context-augmented prompt.

        Args:
            prompt: Full RAG prompt including retrieved context

        Returns:
            Generated response string
        """
        if self._client:
            return await self._call_openai(prompt)
        else:
            return self._demo_response(prompt)

    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI Chat Completions API."""
        try:
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert enterprise IT support assistant. "
                            "Answer accurately using the provided knowledge base context. "
                            "Be concise, professional, and technically precise."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return "An error occurred while generating a response. Please try again or contact support."

    def _demo_response(self, prompt: str) -> str:
        """
        Deterministic mock response for demo/testing.
        Returns a realistic-looking response based on keywords in the prompt.
        """
        prompt_lower = prompt.lower()

        if "password" in prompt_lower or "login" in prompt_lower:
            return (
                "To reset your password:\n"
                "1. Navigate to the login portal at https://sso.enterprise.com\n"
                "2. Click 'Forgot Password'\n"
                "3. Enter your registered email address\n"
                "4. Check your email for the reset link (valid for 15 minutes)\n"
                "5. Set a new password meeting the policy: min 12 chars, 1 uppercase, 1 number, 1 symbol\n\n"
                "If the issue persists, contact IT at ext. 4000 or helpdesk@enterprise.com."
            )
        elif "vpn" in prompt_lower or "network" in prompt_lower:
            return (
                "VPN Connection Troubleshooting:\n"
                "1. Ensure the GlobalProtect VPN client v5.3+ is installed\n"
                "2. Connect to VPN: Open GlobalProtect → Enter your AD credentials\n"
                "3. If connection fails: Check that UDP port 4501 is not blocked by your firewall\n"
                "4. For MFA issues: Ensure your authenticator app is synced\n"
                "5. Restart the GlobalProtect service if the issue persists\n\n"
                "Contact: network-ops@enterprise.com | Hotline: +1-800-VPN-HELP"
            )
        elif "email" in prompt_lower or "outlook" in prompt_lower:
            return (
                "Outlook/Email Issue Resolution:\n"
                "1. Check Office 365 service status at https://status.office365.com\n"
                "2. Clear Outlook cache: Close Outlook → Navigate to %localappdata%\\Microsoft\\Outlook → Delete OST file\n"
                "3. Re-add your email account in Outlook settings\n"
                "4. Ensure your mailbox quota is not exceeded (limit: 50 GB)\n\n"
                "For persistent issues, raise a ticket at https://helpdesk.enterprise.com"
            )
        else:
            return (
                "Based on the enterprise knowledge base, here is the recommended resolution:\n\n"
                "1. Verify the issue aligns with our documented procedures in the IT runbook\n"
                "2. Check the service status dashboard for any ongoing outages\n"
                "3. Attempt a standard restart / clear cache procedure\n"
                "4. If unresolved within 15 minutes, escalate via the ITSM portal\n\n"
                "Reference: ITPOL-2024-007 | SLA: Priority 2 — 4-hour resolution window"
            )
