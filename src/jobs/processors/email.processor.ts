import sendMail from "../../utils/sendMail";

export const emailProcessor = async (job: any) => {
  const { email, subject, template, data } = job.data;
  console.log(`Processing email job for: ${email}`);
  try {
    await sendMail({
      email,
      subject,
      template,
      data,
    });
    console.log(`Email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`Failed to send email to: ${email}`, error);
    throw error;
  }
};
