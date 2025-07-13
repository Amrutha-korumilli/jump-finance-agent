// lib/toolFunctions.js
import { sendEmailThroughGmail } from "./gmail";

export const toolFunctions = {
  send_email: async (params) => {
    const { to, subject, body } = params;
    if (!to || !subject || !body) {
      throw new Error("Missing parameters for send_email");
    }
    await sendEmailThroughGmail({ to, subject, body });
    return { success: true, message: `Email sent to ${to}` };
  }
};

  export async function create_hubspot_contact({ name, email, company }) {
    console.log("Creating HubSpot contact:", { name, email, company });
    // TODO: Use access token and HubSpot API
    return `Created contact for ${name} (${email})`;
  }
  