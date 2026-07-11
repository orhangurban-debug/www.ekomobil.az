import { isOtpPlaintextExposureAllowed, isPhoneOtpSmsConfigured } from "@/lib/phone-otp-config";
import { sendPhoneOtpEmail } from "@/lib/email";

export type PhoneOtpDeliveryChannel = "sms" | "email";

export class PhoneOtpDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhoneOtpDeliveryError";
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  return `${phone.slice(0, Math.max(0, phone.length - 2))}**`;
}

async function sendSmsOtp(phoneNormalized: string, code: string): Promise<{ ok: boolean; error?: string }> {
  const provider = process.env.SMS_OTP_PROVIDER?.trim();
  const apiKey = process.env.SMS_API_KEY?.trim();
  const apiUrl = process.env.SMS_API_URL?.trim();

  if (!provider || !apiKey) {
    return { ok: false, error: "SMS provayderi konfiqurasiya olunmayıb." };
  }

  if (provider === "http" && apiUrl) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          to: phoneNormalized,
          message: `EkoMobil təsdiq kodu: ${code}. Kod 10 dəqiqə etibarlıdır.`
        })
      });
      if (!response.ok) {
        return { ok: false, error: `SMS gateway xətası (${response.status}).` };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "SMS gateway əlçatmazdır." };
    }
  }

  return { ok: false, error: "SMS provayderi dəstəklənmir." };
}

export async function deliverPhoneOtp(input: {
  phoneNormalized: string;
  code: string;
  fallbackEmail?: string;
}): Promise<{ channel: PhoneOtpDeliveryChannel; destinationMasked: string }> {
  if (isPhoneOtpSmsConfigured()) {
    const sms = await sendSmsOtp(input.phoneNormalized, input.code);
    if (sms.ok) {
      return { channel: "sms", destinationMasked: maskPhone(input.phoneNormalized) };
    }
  }

  if (input.fallbackEmail?.trim() && process.env.RESEND_API_KEY?.trim()) {
    const emailResult = await sendPhoneOtpEmail({
      to: input.fallbackEmail.trim(),
      code: input.code,
      phone: input.phoneNormalized
    });
    if (emailResult.ok) {
      return { channel: "email", destinationMasked: maskEmail(input.fallbackEmail.trim()) };
    }
    throw new PhoneOtpDeliveryError(emailResult.error ?? "E-poçt göndərilmədi.");
  }

  if (isOtpPlaintextExposureAllowed()) {
    return { channel: "email", destinationMasked: "development" };
  }

  throw new PhoneOtpDeliveryError(
    "Təsdiq kodu göndərilmədi. SMS servisi aktiv deyil — e-poçt göndərmək üçün dəstək ilə əlaqə saxlayın."
  );
}
