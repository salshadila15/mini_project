import transport from "./transporter";

interface Sender {
    address: string;
    name: string;
}

const DEFAULT_SENDER: Sender = {
    address: "team@example.com",
    name: "Example Team"
};

const SendMail = async (
    sender: Sender,
    recipient: string[],
    subject: string,
    message: string,
) => {

    await transport.sendMail({
    from: `"${DEFAULT_SENDER.name}" <${DEFAULT_SENDER.address}>`, // sender address
    to: recipient.join(", "), // list of recipients
    subject: subject, // subject line
    text: message, // plain text body
    html: `<b>${message}</b>`, // HTML body
});
};

export default SendMail;