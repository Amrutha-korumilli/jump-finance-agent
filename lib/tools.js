export const availableTools = [
  {
    name: "sendEmail",
    description: "Send an email via Gmail.",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The email address of the recipient"
        },
        subject: {
          type: "string",
          description: "The subject of the email"
        },
        body: {
          type: "string",
          description: "The body content of the email"
        }
      },
      required: ["to", "subject", "body"]
    }
  },
  {
    name: "createHubspotContact",
    description: "Create a new HubSpot contact",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name of the contact" },
        email: { type: "string", description: "Email of the contact" },
        company: { type: "string", description: "Company name (optional)" }
      },
      required: ["name", "email"]
    }
  },  
  {
    name: "scheduleMeeting",
    description: "Schedule a new meeting on the user's calendar",
    parameters: {
      type: "object",
      properties: {
        email: { type: "string", description: "Participant's email" },
        time: { type: "string", description: "Meeting ISO datetime" },
        summary: { type: "string", description: "Title or purpose of the meeting" }
      },
      required: ["email", "time", "summary"]
    }
  }
];
