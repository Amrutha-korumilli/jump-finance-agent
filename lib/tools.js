export const tools = [
    {
      name: "sendEmail",
      description: "Send an email to someone. Use when user wants to send a message or schedule something.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "The recipient's email address",
          },
          subject: {
            type: "string",
            description: "The subject of the email",
          },
          body: {
            type: "string",
            description: "The content of the email",
          },
        },
        required: ["to", "subject", "body"],
      },
    },
    {
      name: "createHubspotContact",
      description: "Create a new contact in HubSpot",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          company: { type: "string" },
        },
        required: ["name", "email"],
      },
    },
  ];
  