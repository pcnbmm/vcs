import nodemailer from "nodemailer";

// ฟังก์ชันดึง Transport
const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error(
      "ระบบขาดการตั้งค่า EMAIL_USER หรือ EMAIL_APP_PASSWORD ในไฟล์ .env",
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// Type สำหรับข้อมูลที่เราจะใช้ใน Email
export interface ApproveEmailPayload {
  to: string;
  requesterName: string;
  requestId: string | number;
  destination: string;
  objective: string;
  startDate: string;
}

export interface AssignEmailPayload {
  to: string;
  requesterName: string;
  requestId: string | number;
  destination: string;
  startDate: string;
  carName: string;
  driverName: string;
}

/**
 * ฟังก์ชันหลักเปิดใช้งานสำหรับส่งอีเมลการอนุมัติคำขอ
 */
export const sendApproveEmail = async (payload: ApproveEmailPayload) => {
  try {
    const transporter = getTransporter();
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"; // ให้ใช้ NEXTAUTH_URL ที่มีอยู่ใน .env แล้ว

    // --- HTML EMAIL TEMPLATE ---
    const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        background-color: #f3f4f6;
                        color: #1f2937;
                        margin: 0;
                        padding: 40px 20px;
                        line-height: 1.6;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                    }
                    .header {
                        background-color: #2563eb;
                        color: #ffffff;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; }
                    .content { padding: 40px 30px; }
                    .greeting { font-size: 16px; margin-bottom: 20px; }
                    .status-box {
                        background-color: #dcfce7;
                        border: 1px solid #bbf7d0;
                        border-left: 4px solid #22c55e;
                        padding: 16px 20px;
                        border-radius: 6px;
                        margin-bottom: 30px;
                    }
                    .status-box p { margin: 0; color: #166534; font-weight: 500; font-size: 15px; }
                    .status-box span { font-weight: 700; color: #15803d; }
                    .info-table { width: 100%; border-collapse: collapse; }
                    .info-table th { text-align: left; padding: 14px 0; color: #6b7280; font-weight: 500; width: 35%; border-bottom: 1px solid #f3f4f6; }
                    .info-table td { padding: 14px 0; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6; }
                    .button-wrapper { text-align: center; margin-top: 40px; margin-bottom: 10px; }
                    .button {
                        display: inline-block;
                        padding: 14px 32px;
                        background-color: #2563eb;
                        color: #ffffff !important;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 15px;
                    }
                    .footer {
                        background-color: #f9fafb;
                        padding: 24px 30px;
                        text-align: center;
                        font-size: 13px;
                        color: #9ca3af;
                        border-top: 1px solid #f3f4f6;
                    }
                    .footer p { margin: 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Vehicle Control System</h1>
                    </div>
                    <div class="content">
                        <div class="greeting">สวัสดีคุณ <strong>${payload.requesterName}</strong>,</div>
                        
                        <div class="status-box">
                            <p>🎉 คำขอใช้รถยนต์ของคุณได้รับการ <span>"อนุมัติ"</span> เรียบร้อยแล้ว</p>
                        </div>
                        
                        <table class="info-table">
                            <tr>
                                <th>รหัสคำขอ (Ref)</th>
                                <td>#${payload.requestId}</td>
                            </tr>
                            <tr>
                                <th>จุดหมายปลายทาง</th>
                                <td>${payload.destination}</td>
                            </tr>
                            <tr>
                                <th>วันเดินทาง</th>
                                <td>${payload.startDate}</td>
                            </tr>
                            <tr>
                                <th>จุดประสงค์ (หมายเหตุ)</th>
                                <td>${payload.objective}</td>
                            </tr>
                        </table>

                        <div class="button-wrapper">
                            <a href="${appUrl}/history" class="button">ตรวจสอบรายละเอียดคำขอ</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ VCS<br>กรุณาอย่าตอบกลับอีเมลนี้</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    const mailOptions = {
      from: `"Vehicle Control 🚙" <${process.env.EMAIL_USER}>`,
      to: payload.to,
      subject: `✅ คำขอเบิกใช้รถยนต์ได้รับการอนุมัติแล้ว (Ref #${payload.requestId})`,
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[EmailService] ✅ Approve Email Sent: %s", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    // ดัก Error เพื่อไม่ให้หน้าเว็บล่ม กรณีส่งเมลมีปัญหา
    console.error("[EmailService] ❌ Failed to send approve email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Error",
    };
  }
};

export const sendAssignEmail = async (payload: AssignEmailPayload) => {
  try {
    const transporter = getTransporter();
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                        background-color: #f3f4f6;
                        color: #1f2937;
                        margin: 0;
                        padding: 40px 20px;
                        line-height: 1.6;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #ffffff;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
                    }
                    .header {
                        background-color: #2563eb;
                        color: #ffffff;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; }
                    .content { padding: 40px 30px; }
                    .greeting { font-size: 16px; margin-bottom: 20px; }
                    .status-box {
                        background-color: #eff6ff;
                        border: 1px solid #bfdbfe;
                        border-left: 4px solid #3b82f6;
                        padding: 16px 20px;
                        border-radius: 6px;
                        margin-bottom: 30px;
                    }
                    .status-box p { margin: 0; color: #1e40af; font-weight: 500; font-size: 15px; }
                    .status-box span { font-weight: 700; color: #1d4ed8; }
                    .info-table { width: 100%; border-collapse: collapse; }
                    .info-table th { text-align: left; padding: 14px 0; color: #6b7280; font-weight: 500; width: 35%; border-bottom: 1px solid #f3f4f6; }
                    .info-table td { padding: 14px 0; font-weight: 600; color: #111827; border-bottom: 1px solid #f3f4f6; }
                    .button-wrapper { text-align: center; margin-top: 40px; margin-bottom: 10px; }
                    .button {
                        display: inline-block;
                        padding: 14px 32px;
                        background-color: #2563eb;
                        color: #ffffff !important;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 15px;
                    }
                    .footer {
                        background-color: #f9fafb;
                        padding: 24px 30px;
                        text-align: center;
                        font-size: 13px;
                        color: #9ca3af;
                        border-top: 1px solid #f3f4f6;
                    }
                    .footer p { margin: 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Vehicle Control System</h1>
                    </div>
                    <div class="content">
                        <div class="greeting">สวัสดีคุณ <strong>${payload.requesterName}</strong>,</div>
                        
                        <div class="status-box">
                            <p>🚗 ระบบได้ทำการ <span>"จัดสรรยานพาหนะและคนขับ"</span> สำหรับคำขอของคุณเรียบร้อยแล้ว</p>
                        </div>
                        
                        <table class="info-table">
                            <tr>
                                <th>รหัสคำขอ (Ref)</th>
                                <td>#${payload.requestId}</td>
                            </tr>
                            <tr>
                                <th>ยานพาหนะ</th>
                                <td>${payload.carName}</td>
                            </tr>
                            <tr>
                                <th>ผู้ขับขี่</th>
                                <td>${payload.driverName}</td>
                            </tr>
                            <tr>
                                <th>วันเดินทาง</th>
                                <td>${payload.startDate}</td>
                            </tr>
                            <tr>
                                <th>จุดหมายปลายทาง</th>
                                <td>${payload.destination}</td>
                            </tr>
                        </table>

                        <div class="button-wrapper">
                            <a href="${appUrl}/history" class="button">ตรวจสอบรายละเอียดคำขอ</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>อีเมลฉบับนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ VCS<br>กรุณาอย่าตอบกลับอีเมลนี้</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    const mailOptions = {
      from: `"Vehicle Control 🚙" <${process.env.EMAIL_USER}>`,
      to: payload.to,
      subject: `🚗 ระบบได้จัดสรรยานพาหนะสำหรับคำขอของคุณแล้ว (Ref #${payload.requestId})`,
      html: htmlTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("[EmailService] ✅ Assign Email Sent: %s", info.messageId);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[EmailService] ❌ Failed to send assign email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Error",
    };
  }
};
