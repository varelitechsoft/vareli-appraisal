window.SCHEMA = {
  id: "supervisor",
  idField: "supId",
  nameField: "supName",
  sections: [
    {
      title: "Employee information", short: "Employee", grid: true,
      hint: "The Employee ID links this assessment to the employee's self-assessment.",
      fields: [
        { key: "empName", type: "text", label: "Employee name" },
        { key: "empId", type: "text", label: "Employee ID" },
        { key: "department", type: "text", label: "Department" },
        { key: "project", type: "text", label: "Project / location" },
        { key: "position", type: "text", label: "Position held" },
      ],
    },
    {
      title: "Goals", short: "Goals",
      fields: [
        { key: "kras", type: "textarea", rows: 5, label: "List three (3) important jobs / KRAs performed by the employee on a day-to-day basis", placeholder: "1.\n2.\n3." },
      ],
    },
    {
      title: "Role experience and performance", short: "Performance",
      cols: { rating: true, justification: true },
      guide: {
        title: "Rating guide",
        items: [
          ["1", "Performance is substantially below expectations; significant improvement is required (Needs Significant Improvement)"],
          ["2", "Some expectations are met, but important gaps remain (Partially Meets)"],
          ["3", "Consistently meets the requirements of the role (Meets Expectations)"],
          ["4", "Frequently goes beyond normal role expectations (Exceeds Expectations)"],
          ["5", "Consistently delivers exceptional results and significant added value (Exceptional / Outstanding)"],
        ],
      },
      hint: "Assess independently using observed performance, results, behaviours and agreed role expectations. Do not refer to or rely on the employee's self-assessment.",
      rows: [
        { id: "goals", title: "Understanding of goals and priorities", prompt: "Assess the employee's understanding of goals, priorities and ownership." },
        { id: "contribution", title: "Role contribution and engagement", prompt: "Assess the employee's quality of work, initiative and contribution." },
        { id: "problem", title: "Challenges and problem-solving", prompt: "Assess how effectively challenges are handled and resolved by the employee." },
        { id: "alignment", title: "Role alignment", prompt: "Assess the employee's capability and alignment with current responsibilities." },
      ],
    },
    {
      title: "Skills development", short: "Skills",
      cols: { remarksLabel: "Remarks / recommendation (as applicable)" },
      rows: [
        { id: "skillsDev", title: "Skills developed", prompt: "Mention any specific skills developed or trainings undertaken by the employee during the past 6 months.", assessment: true },
        { id: "skillsGap", title: "Skills to strengthen", prompt: "Identify important skill gaps and recommend any specific skill development programs / trainings.", assessment: true },
        { id: "readiness", title: "Readiness for new responsibility", prompt: "Assess the employee's readiness for taking up new responsibility and identify suitable opportunities or prerequisites.", assessment: true },
      ],
    },
    {
      title: "Wellbeing and work experience", short: "Wellbeing",
      cols: { rating: true, justification: true },
      rows: [
        { id: "wlb", title: "Work-life balance", prompt: "How well does the employee balance professional and personal life?" },
        { id: "wellbeing", title: "Wellbeing support", prompt: "Any specific red flag that needs to be highlighted pertaining to behavioural or professional fitment." },
      ],
    },
    {
      title: "Teamwork, collaboration and support", short: "Teamwork",
      cols: { rating: true, justification: true },
      rows: [
        { id: "peer", title: "Peer / colleague support", prompt: "Assess collaboration, cooperation and contribution to the team." },
        { id: "crossDept", title: "Cross-department collaboration", prompt: "Assess stakeholder management and cooperation across departments." },
        { id: "hr", title: "HR / organisational support", prompt: "Active and prompt participation in HR activities." },
      ],
    },
    {
      title: "Overall assessment", short: "Overall",
      hint: "Assess the employee's overall performance for the first half of the year (April 2026 – September 2026). Mention any specific achievement by the employee in terms of work. Use judgement across the full six-month period; do not simply copy the average.",
      fields: [
        { key: "overallRating", header: "Overall assessment: rating (1-5)", type: "scale", max: 5, captions: true, label: "Overall rating (1–5)" },
        { key: "keyStrength", header: "Overall assessment: key strength", type: "textarea", label: "Key strength" },
        { key: "overallWhy", header: "Overall assessment: justification for rating", type: "textarea", label: "Justification for rating" },
        { key: "overallRemarks", header: "Overall assessment: additional remarks", type: "textarea", label: "Additional remarks (if any)", optional: true },
      ],
    },
    {
      title: "Sign-off", short: "Sign-off", grid: true,
      fields: [
        { key: "supName", type: "text", label: "Supervisor name" },
        { key: "supId", header: "Supervisor Employee ID", type: "text", label: "Supervisor Employee ID", sub: "Filled in from your personal link." },
        { key: "signDate", header: "Sign-off date", type: "date", label: "Date" },
      ],
      declaration: "I confirm that this assessment is based on my own observation of the employee's performance during the period.",
    },
  ],
};
