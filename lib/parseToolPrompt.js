// lib/parseToolPrompt.js

export function extractToolCommand(text) {
    if (!text?.toLowerCase().startsWith("tool:")) return null;
  
    const lower = text.toLowerCase();
  
    if (lower.includes("sendemail")) {
      const toMatch = text.match(/to:\s*([\w.-]+@[\w.-]+\.\w+)/i);
      const subjectMatch = text.match(/subject:\s*(.+?)\s*body:/i);
      const bodyMatch = text.match(/body:\s*(.+)/i);
  
      return {
        name: "sendEmail",
        to: toMatch?.[1] || "",
        subject: subjectMatch?.[1]?.trim() || "No Subject",
        body: bodyMatch?.[1]?.trim() || "",
      };
    }
  
    if (lower.includes("createhubspotcontact")) {
      const nameMatch = text.match(/name:\s*(.+?)\s+email:/i);
      const emailMatch = text.match(/email:\s*([\w.-]+@[\w.-]+\.\w+)/i);
      const companyMatch = text.match(/company:\s*(.+)/i);
  
      return {
        name: "createHubspotContact",
        contactname: nameMatch?.[1]?.trim() || "",
        email: emailMatch?.[1] || "",
        company: companyMatch?.[1]?.trim() || "",
      };
    }
  
    if (lower.includes("schedulemeeting")) {
      const emailMatch = text.match(/email:\s*([\w.-]+@[\w.-]+\.\w+)/i);
      const timeMatch = text.match(/time:\s*([^\n]+)/i);
      const summaryMatch = text.match(/summary:\s*([^\n]+)/i);
  
      return {
        name: "scheduleMeeting",
        email: emailMatch?.[1] || "",
        time: timeMatch?.[1]?.trim() || "",
        summary: summaryMatch?.[1]?.trim() || "",
      };
    }
  
    return null;
  }
  