import nodemailer from "nodemailer";const myGmail = process.env.GOOGLE_APP_USER;
const pass = process.env.GOOGLE_APP_PASS;

export interface FMData {
  fmNumber: string;
  date: string;
  from: string;
  to: string;
  body: string;
  lrNumbers: string[];
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  totalAmt: string;
}

export const FMEmailBody = (
  FMData: FMData
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>105256 is your Cadalu verification code</title>
    <style type="text/css">
        #outlook a {
            padding: 0
        }

        .ExternalClass {
            width: 100%
        }

        .ExternalClass,
        .ExternalClass p,
        .ExternalClass span,
        .ExternalClass font,
        .ExternalClass td,
        .ExternalClass div {
            line-height: 100%
        }

        body,
        table,
        td,
        a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%
        }

        table,
        td {
            mso-table-lspace: 0;
            mso-table-rspace: 0
        }

        img {
            -ms-interpolation-mode: bicubic
        }

        img {
            border: 0;
            outline: none;
            text-decoration: none
        }

        a img {
            border: none
        }

        td img {
            vertical-align: top
        }

        table,
        table td {
            border-collapse: collapse
        }

        body {
            margin: 0;
            padding: 0;
            width: 100% !important
        }



        @media all and (max-width:639px) {


            .mobile-image,
            .mobile-image img {
                height: auto !important;
                max-width: 600px !important;
                width: 100% !important
            }
        }
    </style>

</head>

<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
    <table cellpadding="0" cellspacing="0" border="0" width="600" class="main container"
        style="width: 600px; border-collapse: separate;">
        <tbody>
            <tr>
                <td align="left" valign="top" bgcolor="#fff"
                    style="vertical-align: top; line-height: 1; background-color: #ffffff; border-radius: 0px;">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" class="block"
                        style="width: 100%; border-collapse: separate;">
                        <tbody>
                            <tr>
                                <td align="left" valign="top" bgcolor="#ffffff"
                                    style="vertical-align: top; line-height: 1; padding: 32px 32px 48px; background-color: #ffffff; border-radius: 0px;">
                                    <h1 class="h1" align="left"
                                        style="padding: 0px; margin: 0px; font-style: normal; font-family: Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 500;">
                                        Hi There, </h1>
                                    <p align="left"
                                        style="padding: 0px; margin: 32px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px; line-height: 21px;">
                                        ${FMData.body}</p>
                                    <div align="left"
                                        style="padding: 0px;  font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px;">
                                        <p style="font-size: 16px;">
                                            Freight Details:
                                        </p>
                                        <div>
                                            <p style="font-weight: 600;">
                                                FM Number:
                                                <span style="font-weight: 500;"> ${FMData.fmNumber}</span>
                                            </p>
                                            <p style="font-weight: 600;">
                                                PickUp Location:
                                                <span style="font-weight: 500;"> ${FMData.from}</span>
                                            </p>
                                            <p style="font-weight: 600;">
                                                Delivery Location:
                                                <span style="font-weight: 500;"> ${FMData.to}</span>
                                            </p>
                                            <p style="font-weight: 600;">
                                                Vehicle Number:
                                                <span style="font-weight: 500;"> ${FMData.vehicleNo}</span>
                                            </p>
                                            <p style="font-weight: 600;">
                                                Driver Name:
                                                <span style="font-weight: 500;"> ${FMData.driverName}</span>
                                            </p>
                                            <p style="font-weight: 600;">
                                                Driver Contact:
                                                <span style="font-weight: 500;"> ${FMData.driverPhone}</span>
                                            </p>
                                            <p style="font-weight: 600;">
                                                LR Number (s):
                                                <span style="font-weight: 500;"> ${FMData.lrNumbers}</span>
                                            </p>
                                            <p style="font-weight: 600;">
                                                Total Freight Amount:
                                                <span style="font-weight: 500;"> ${FMData.totalAmt} rupees</span>
                                            </p>
                                        </div>
                                    </div>
                                    <p
                                        style="padding: 0px; margin: 30px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px; line-height: 21px;">
                                        Warm regards,
                                    </p>
                                    <p
                                        style="padding: 0px; margin: 0px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px; line-height: 21px;">
                                        Shivam Jha </p>
                                    <p
                                        style="padding: 0px; margin: 0px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px; line-height: 21px;">
                                        CEO </p>
                                    <p
                                        style="padding: 0px; margin: 0px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px; line-height: 21px;">
                                        Shree LN Logistics </p>
                                    <p
                                        style="padding: 0px; margin: 0px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px; line-height: 21px;">
                                        +91 90364416521 </p>
                                    <p
                                        style="padding: 0px; margin: 0px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px; line-height: 21px;">
                                        Website: www.shreelnlogistics.com </p>

                                    <img class="mobile-image" src="https://shreelnlogistics-bucket.s3.ap-south-1.amazonaws.com/logo.png"
                                        alt="shreelnlogistics Logo"
                                        style="max-width: 300x; width: 300px; margin: 20px 0px 20px;">
                                    <p
                                        style="padding: 0px; margin: 0px 0px 0px; font-family: Helvetica, Arial, sans-serif; color: #000000; font-size: 14px; line-height: 21px;">
                                        Flat No.203, 3rd Floor, Sai Godavari Apartment, Kuduregere Road, Madanayakanahalli, Bangalore Rural - 562162</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
    </td>
    </tr>
    </tbody>
    </table>
</body>

</html>`;

export const sendFMEmailToClient = async (
  email: string,
  subject: string,
  body: string,
  attachments: {
    filename: string;
    content: Buffer;
    contentType: string;
  }[]
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtppro.zoho.in",
      port: 465,
      secure: true,
      auth: {
        user: myGmail,
        pass: pass,
      },
    });

    const info = await transporter.sendMail({
      from: `Shree LN Logistics <${myGmail}>`,
      to: email,
      subject: subject,
      html: body,
      attachments: attachments
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
