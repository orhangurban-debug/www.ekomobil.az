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
              <p style="margin:6px 0 0;font-size:11px;color:#cbd5e1;">Bu e-poçt avtomatik olaraq göndərilib. Suallarınız üçün <a href="mailto:support@ekomobil.az" style="color:#38bdf8;text-decoration:none;">support@ekomobil.az</a></p>
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
      from: "Ekomobil.az <noreply@ekomobil.az>",
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
