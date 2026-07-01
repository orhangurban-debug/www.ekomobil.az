/**
 * Telefon OTP konfiqurasiyası.
 * SMS provayder qoşulmayana qədər xərc yoxdur — OTP yalnız DB-də saxlanılır.
 */

export function isOtpPlaintextExposureAllowed(): boolean {
  return (
    process.env.ALLOW_OTP_PLAINTEXT_IN_RESPONSE === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

/** SMS gateway env-ləri təyin olunanda true olacaq (gələcək inteqrasiya). */
export function isPhoneOtpSmsConfigured(): boolean {
  return Boolean(process.env.SMS_OTP_PROVIDER?.trim() && process.env.SMS_API_KEY?.trim());
}
