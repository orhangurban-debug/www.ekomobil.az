import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY mühit dəyişəni təyin olunmayıb");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface InvoiceEmailData {
  to: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPriceAzn: number;
    totalAzn: number;
  }>;
  totalAzn: number;
  netAmountAzn?: number;
  vatAmountAzn?: number;
  vatRatePercent?: number;
  paymentReference?: string;
  invoiceUrl: string;
}

function buildInvoiceHtml(data: InvoiceEmailData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155;">${item.description}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:center;">${item.quantity}</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#64748b;text-align:right;">${item.unitPriceAzn.toFixed(2)} ₼</td>
        <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${item.totalAzn.toFixed(2)} ₼</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>İnvoys ${data.invoiceNumber} – Ekomobil.az</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Ekomobil<span style="color:#38bdf8;">.az</span></div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Azərbaycanın avtomobil marketplace-i</div>
                  </td>
                  <td align="right">
                    <div style="font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:1px;">İnvoys</div>
                    <div style="font-size:20px;font-weight:800;color:#ffffff;margin-top:4px;">${data.invoiceNumber}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meta info -->
          <tr>
            <td style="padding:28px 40px 0;border-bottom:1px solid #f1f5f9;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:24px;">
                    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">Kiminə</div>
                    <div style="font-size:15px;font-weight:700;color:#0f172a;">${data.customerName || data.customerEmail}</div>
                    <div style="font-size:13px;color:#64748b;margin-top:2px;">${data.customerEmail}</div>
                  </td>
                  <td align="right" style="padding-bottom:24px;">
                    <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;">Tarix</div>
                    <div style="font-size:14px;font-weight:600;color:#0f172a;">${data.invoiceDate}</div>
                    ${
                      data.paymentReference
                        ? `<div style="font-size:11px;color:#94a3b8;margin-top:6px;">Ref: ${data.paymentReference}</div>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items table -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <thead>
                  <tr style="background:#f8fafc;">
                    <th style="padding:12px 16px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;text-align:left;">Xidmət</th>
                    <th style="padding:12px 16px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;text-align:center;">Miqdar</th>
                    <th style="padding:12px 16px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;text-align:right;">Vahid qiymət</th>
                    <th style="padding:12px 16px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;text-align:right;">Cəmi</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Total -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td></td>
                  <td style="width:240px;">
                    ${
                      data.vatAmountAzn !== undefined && data.vatAmountAzn > 0
                        ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                      <tr>
                        <td style="padding:6px 16px;font-size:13px;color:#64748b;">Net məbləğ</td>
                        <td style="padding:6px 16px;font-size:13px;color:#64748b;text-align:right;">${(data.netAmountAzn ?? 0).toFixed(2)} ₼</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 16px;font-size:13px;color:#64748b;">ƏDV (${data.vatRatePercent ?? 18}%)</td>
                        <td style="padding:6px 16px;font-size:13px;color:#64748b;text-align:right;">${data.vatAmountAzn.toFixed(2)} ₼</td>
                      </tr>
                    </table>`
                        : ""
                    }
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid #0f172a;margin-top:8px;">
                      <tr>
                        <td style="padding:14px 16px;font-size:15px;font-weight:700;color:#0f172a;">Ümumi məbləğ</td>
                        <td style="padding:14px 16px;font-size:18px;font-weight:800;color:#0f172a;text-align:right;">${data.totalAzn.toFixed(2)} ₼</td>
                      </tr>
                    </table>
                    <div style="background:#dcfce7;border-radius:8px;padding:10px 16px;margin-top:8px;text-align:center;">
                      <span style="font-size:13px;font-weight:700;color:#15803d;">Ödəniş təsdiqləndi</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 40px;background:#f8fafc;text-align:center;border-top:1px solid #f1f5f9;">
              <a href="${data.invoiceUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;letter-spacing:.2px;">
                İnvoysı tam bax &amp; çap et
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;text-align:center;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Ekomobil.az · Bakı, Azərbaycan</p>
              <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">Bu e-poçt avtomatik olaraq göndərilib. Suallarınız üçün <a href="${getAppBaseUrl()}/trust#support-request" style="color:#38bdf8;text-decoration:none;">yeni müraciət göndərin</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<{ ok: boolean; error?: string }> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: "Ekomobil.az <info@ekomobil.az>",
      to: data.to,
      subject: `İnvoys ${data.invoiceNumber} – Ödənişiniz qəbul edildi`,
      html: buildInvoiceHtml(data)
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "E-poçt göndərilə bilmədi" };
  }
}

export async function sendPhoneOtpEmail(input: {
  to: string;
  code: string;
  phone: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: "EkoMobil.az <info@ekomobil.az>",
      to: input.to,
      subject: "Telefon təsdiq kodu — EkoMobil",
      html: `<!DOCTYPE html>
<html lang="az">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#0057FF;padding:24px 32px;">
            <h1 style="margin:0;font-size:18px;color:#fff;">Telefon təsdiqi</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#334155;">Telefon nömrənizi təsdiqləmək üçün aşağıdakı kodu daxil edin:</p>
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Nömrə: <strong>${input.phone}</strong></p>
            <p style="margin:16px 0;font-size:32px;font-weight:700;letter-spacing:6px;color:#0f172a;text-align:center;">${input.code}</p>
            <p style="margin:0;font-size:13px;color:#94a3b8;">Kod 10 dəqiqə etibarlıdır. Bu kodu heç kimlə paylaşmayın.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "E-poçt göndərilmədi" };
  }
}

// ─── Support reply email ──────────────────────────────────────────────────────

export interface SupportReplyEmailData {
  to: string;
  recipientName?: string;
  originalSubject: string;
  requestId: string;
  adminResponse: string;
}

function getAppBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://ekomobil.az").replace(/\/$/, "");
}

function buildSupportReplyHtml(data: SupportReplyEmailData): string {
  const greeting = data.recipientName ? `Hörmətli ${data.recipientName},` : "Salam,";
  const followUpSubject = `Re: ${data.originalSubject}`;
  const supportFormUrl = `${getAppBaseUrl()}/trust?type=question&subject=${encodeURIComponent(followUpSubject)}#support-request`;
  const escapedResponse = data.adminResponse
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `<!DOCTYPE html>
<html lang="az">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Müraciətinizə cavab – Ekomobil.az</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:28px 40px;">
              <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Ekomobil<span style="color:#38bdf8;">.az</span></div>
              <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Dəstək xidməti</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:.8px;">Müraciətinizə cavab</p>
              <p style="margin:0 0 20px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">Müraciətiniz cavablandırıldı</p>

              <p style="margin:0 0 8px;font-size:15px;color:#334155;">${greeting}</p>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;">
                <strong style="color:#0f172a;">${data.originalSubject.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong>
                mövzusundakı müraciətinizə cavab verildi.
              </p>

              <!-- Reply box -->
              <div style="background:#f0f9ff;border-left:4px solid #0891b2;border-radius:8px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#0891b2;text-transform:uppercase;letter-spacing:.8px;">EkoMobil Dəstəyin cavabı</p>
                <p style="margin:0;font-size:15px;color:#0f172a;line-height:1.6;">${escapedResponse}</p>
              </div>

              <p style="margin:0 0 16px;font-size:13px;color:#64748b;">
                Əlavə sualınız varsa saytdan yeni müraciət yaradın:
              </p>
              <a href="${supportFormUrl}"
                 style="display:inline-block;background:#0891b2;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:13px 28px;border-radius:10px;">
                Yeni müraciət göndər
              </a>
            </td>
          </tr>

          <!-- No-reply notice -->
          <tr>
            <td style="padding:0 40px 28px;">
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;">
                <p style="margin:0;font-size:13px;font-weight:600;color:#92400e;">Bu e-poçta cavab yazmayın</p>
                <p style="margin:6px 0 0;font-size:12px;color:#b45309;line-height:1.5;">
                  Bu ünvana göndərilən cavablar qəbul edilmir. Yeni sual və ya əlavə məlumat üçün
                  <a href="${supportFormUrl}" style="color:#0891b2;font-weight:600;text-decoration:none;">ekomobil.az/trust</a>
                  səhifəsindən müraciət formu doldurun.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Ekomobil.az · Bakı, Azərbaycan</p>
              <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">
                Müraciət ID: ${data.requestId.slice(0, 8)} · Avtomatik bildiriş, cavab gözlənilmir
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Ad-request emails ────────────────────────────────────────────────────────

export interface AdRequestConfirmationData {
  to: string;
  contactName: string;
  companyName: string;
  slotLabel: string;
}

export interface AdRequestAdminAlertData {
  to: string;
  record: {
    id: string;
    slotId: string;
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string | null;
    websiteUrl: string | null;
    message: string | null;
    budgetAzn: number | null;
    durationDays: number | null;
    isWaitlist: boolean;
  };
  slotLabel: string;
}

export async function sendAdRequestConfirmation(
  data: AdRequestConfirmationData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: "EkoMobil Reklam <reklam@ekomobil.az>",
      to: data.to,
      subject: "Reklam müraciətiniz qeydə alındı — EkoMobil.az",
      html: `<!DOCTYPE html>
<html lang="az">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 40px;">
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px;">EkoMobil<span style="color:#38bdf8;">.az</span></h1>
            <p style="margin:8px 0 0;font-size:13px;color:#94a3b8;">Reklam Xidməti</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:#0f172a;">Hörmətli ${data.contactName},</h2>
            <p style="margin:0 0 20px;font-size:15px;color:#334155;line-height:1.6;">
              <strong>${data.companyName}</strong> adından göndərdiyiniz reklam müraciəti uğurla qeydə alındı.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;padding:20px;margin-bottom:24px;">
              <tr>
                <td style="font-size:13px;color:#64748b;padding-bottom:8px;"><strong style="color:#0f172a;">Seçilmiş slot:</strong></td>
                <td style="font-size:13px;color:#0f172a;text-align:right;">${data.slotLabel}</td>
              </tr>
            </table>
            <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:0 8px 8px 0;margin-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#1e40af;line-height:1.6;">
                <strong>Növbəti addımlar:</strong><br>
                Komandamız <strong>1–2 iş günü</strong> ərzində sizinlə əlaqə saxlayacaq. Slot mövcudluğunu, qiyməti və yayım müddətini razılaşdırdıqdan sonra ödəniş linki göndəriləcək. Ödəniş təsdiqindən sonra reklamınız aktivləşdiriləcək.
              </p>
            </div>
            <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
              Suallarınız üçün: <a href="mailto:reklam@ekomobil.az" style="color:#0891b2;">reklam@ekomobil.az</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">Ekomobil.az · Bakı, Azərbaycan · Avtomatik bildiriş</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "E-poçt göndərilə bilmədi" };
  }
}

export async function sendAdRequestAdminAlert(
  data: AdRequestAdminAlertData
): Promise<{ ok: boolean; error?: string }> {
  const r = data.record;
  try {
    const resend = getResend();
    const rows = [
      ["Şirkət", r.companyName],
      ["Əlaqə şəxsi", r.contactName],
      ["E-poçt", r.contactEmail],
      ["Telefon", r.contactPhone ?? "—"],
      ["Veb-sayt", r.websiteUrl ?? "—"],
      ["Slot", data.slotLabel],
      ["Növ", r.isWaitlist ? "Gözləmə siyahısı" : "Aktiv müraciət"],
      ["Büdcə (₼)", r.budgetAzn != null ? String(r.budgetAzn) : "—"],
      ["Müddət (gün)", r.durationDays != null ? String(r.durationDays) : "—"],
      ["Mesaj", r.message ?? "—"]
    ]
      .map(
        ([k, v]) =>
          `<tr><td style="padding:8px 12px;font-size:13px;color:#64748b;white-space:nowrap;">${k}</td><td style="padding:8px 12px;font-size:13px;color:#0f172a;">${v}</td></tr>`
      )
      .join("");

    const { error } = await resend.emails.send({
      from: "EkoMobil Sistem <system@ekomobil.az>",
      to: data.to,
      subject: `Yeni reklam müraciəti — ${r.companyName} (${data.slotLabel})`,
      html: `<!DOCTYPE html>
<html lang="az">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <h1 style="margin:0;font-size:18px;color:#fff;">Yeni Reklam Müraciəti</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
              ${rows}
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="https://ekomobil.az/admin/ad-requests" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Admin paneldə bax</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "E-poçt göndərilə bilmədi" };
  }
}

export async function sendSupportReplyEmail(data: SupportReplyEmailData): Promise<{ ok: boolean; error?: string }> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: "EkoMobil Dəstək <info@ekomobil.az>",
      to: data.to,
      subject: `Re: ${data.originalSubject}`,
      html: buildSupportReplyHtml(data)
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "E-poçt göndərilə bilmədi" };
  }
}
