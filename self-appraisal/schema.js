window.SCHEMA = {
  id: "self",
  sections: [
    {
      title: "Employee information", short: "Your details", grid: true,
      hint: "Complete the basic details before starting the reflection.",
      fields: [
        { key: "empName", type: "text", label: "Employee name" },
        { key: "date", header: "Form date", type: "date", label: "Date" },
        { key: "empId", type: "text", label: "Employee ID" },
        { key: "project", type: "text", label: "Project / location" },
        { key: "department", type: "text", label: "Department" },
        { key: "position", type: "text", label: "Position held" },
      ],
    },
    {
      title: "Role experience", short: "Role experience",
      hint: "Use examples where possible. Add a 1–5 self rating to capture your current experience.",
      guide: {
        title: "What each self rating means",
        items: [
          ["1", "Needs significant improvement. I am below the expected level and need substantial improvement and support."],
          ["2", "Partially meets expectations. I meet some expectations but have specific areas to improve."],
          ["3", "Meets expectations. I consistently perform my role as expected and deliver my responsibilities effectively."],
          ["4", "Exceeds expectations. I frequently go beyond my normal responsibilities and deliver above expectations."],
          ["5", "Exceptional / outstanding. I consistently deliver exceptional results beyond my role expectations."],
        ],
      },
      fields: [
        { key: "responsibilities", type: "textarea", rows: 5, label: "List three (3) important job responsibilities that you perform", placeholder: "1.\n2.\n3." },
        { key: "enjoy", type: "textarea", label: "What do you enjoy most about your current role?", sub: "Share the key aspects that you find engaging, meaningful, or motivating." },
        { key: "challenges", type: "textarea", label: "What challenges do you face in your daily work?" },
        { key: "mgmtHelp", type: "textarea", label: "How can the management or supervisor help resolve the challenges that you face?" },
        { key: "roleMatch", type: "textarea", label: "Do you think your current role matches your vision, qualification and work experience? If not, state reasons." },
        { key: "achievement", type: "textarea", label: "What is your key achievement or contribution in the last six (6) months?", sub: "Explain the impact with measurable results, such as time saved, cost reduced, targets achieved, or improvements made." },
        { key: "roleRating", header: "Role experience: self rating (1-5)", type: "scale", max: 5, captions: true, label: "Self rating for role experience (1–5)" },
      ],
    },
    {
      title: "Skills and development", short: "Skills",
      hint: "Use examples where possible. Add a 1–5 self rating to capture your current experience.",
      fields: [
        { key: "trainings", type: "textarea", label: "Mention any skill development training or certification that you have undertaken in the past 6 months" },
        { key: "strengthen", type: "textarea", label: "What skill(s) would you like to strengthen in the next six months?", sub: "What learning, training, mentoring or exposure would help you perform better?" },
        { key: "newResp", type: "textarea", label: "What new responsibility or project would you like to take up in the coming months?" },
        { key: "skillsRating", header: "Skills and development: self rating (1-5)", type: "scale", max: 5, captions: true, label: "Self rating for skills and development (1–5)" },
      ],
    },
    {
      title: "Wellbeing and work experience", short: "Wellbeing",
      hint: "Use examples where possible. Add a 1–5 self rating to capture your current experience.",
      fields: [
        { key: "wlbRating", header: "Work-life balance: self rating (1-5)", type: "scale", max: 5, captions: true, label: "How would you rate your current work-life balance? (1–5)" },
        { key: "wlbWhy", header: "Work-life balance: justification", type: "textarea", label: "Justify your rating" },
        { key: "wellbeingSupport", type: "textarea", label: "What support from the company would help you maintain your overall well-being and work-life balance?" },
      ],
    },
    {
      title: "Supervisory support", short: "Supervisor",
      hint: "Use examples where possible. Add a 1–10 supervisor rating to capture your current experience.",
      guide: {
        title: "How to rate your supervisor (1–10)",
        items: [
          ["1–3", "Needs significant improvement"],
          ["4–5", "Needs improvement / partially satisfactory"],
          ["6–7", "Meets expectations"],
          ["8–9", "Exceeds expectations"],
          ["10", "Outstanding"],
          ["Consider", "Leadership, communication, accessibility, fairness, guidance, recognition, support, and contribution to your professional development."],
        ],
      },
      fields: [
        { key: "supAction", type: "textarea", label: "What specific action can your supervisor take to support your growth, skills, or career development?", sub: "Please mention at least one." },
        { key: "supRating", header: "Supervisor communication: rating of supervisor (1-10)", type: "scale", max: 10, captions: true, label: "How effectively does your supervisor communicate expectations, feedback, guidance, and important information? Rate your supervisor (1–10)" },
        { key: "supExamples", header: "Supervisor communication: examples to support rating", type: "textarea", label: "Examples to support your rating" },
      ],
    },
    {
      title: "Other support and overall", short: "Other support",
      fields: [
        { key: "peers", type: "yesno", label: "Do you receive adequate support from your peers / colleagues?", detailLabel: "If no, specify instances of non-cooperation" },
        { key: "crossDept", type: "yesno", label: "Do you receive adequate support from other departments for cross-departmental work?", detailLabel: "If no, specify instances of non-cooperation" },
        { key: "hrSupport", type: "yesno", label: "Do you receive adequate support from HR?", detailLabel: "If no, specify instances of non-cooperation" },
        { key: "teamRating", header: "Teamwork: self rating (1-5)", type: "scale", max: 5, captions: true, label: "Rate yourself on teamwork or team coordination (1–5)" },
        { key: "teamWhy", header: "Teamwork: justification", type: "textarea", label: "Justify your teamwork rating" },
        { key: "overallRating", header: "Overall performance: self rating (1-5)", type: "scale", max: 5, captions: true, label: "Rate your overall performance during the past 6 months (1–5)", sub: "April 2026 – September 2026" },
        { key: "overallWhy", header: "Overall performance: significant achievement", type: "textarea", label: "Mention any significant achievement by you during this assessment period" },
      ],
    },
    {
      title: "Sign-off", short: "Sign-off", grid: true,
      hint: "Check that your reflections, ratings, next-six-month priority and support request are complete.",
      fields: [
        { key: "signature", header: "Employee signature", type: "text", label: "Employee signature (type your full name)" },
        { key: "submissionDate", type: "date", label: "Submission date", readonly: true },
      ],
      declaration: "I confirm that the answers above are my own and are accurate to the best of my knowledge.",
    },
  ],
};
