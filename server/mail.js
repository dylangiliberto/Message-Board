var pwd = require('./passwords');

async function sendMail(mailer, address, subject, body){
    const transporter = mailer.createTransport({
      host: pwd.mail_host,
      port: 465,
      secure: true, // true for port 465, false for other ports
      auth: {
        user: pwd.mail_username,
        pass: pwd.mail_password
      },
    });

    let blah = await transporter.sendMail({
        from: '"Dylang140.com" <server@dylangiliberto.com>', // sender address
        to: address, // list of receivers
        subject: subject, // Subject line
        text: body, // plain text body
        html: body, // html body
      });
      
      console.log("Message sent: %s", blah.messageId);
}


module.exports = { sendMail };

