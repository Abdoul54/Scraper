let info = [
  "Course Summary",
  "",
  "It’s hard to go from one week to the next without seeing news about artificial intelligence (AI), with sometimes exaggerated utopian benefits or dystopian risks. In business, though, AI provides extremely valuable and concrete benefits.",
  "",
  "In this course we’d like to help you navigate through the confusion and exaggeration about AI to explain AI’s fundamental uses and business benefits. We’ll also explain why and how AI doesn’t always get it right, but despite that, how valuable it is when applied correctly within a trusted enterprise software environment.",
  "",
  "Additionally, you’ll learn about different approaches to AI, from classic machine learning to generative AI. Furthermore, you’ll go through a few illustrative use cases within SAP products and solutions, covering the various types of AI that we’ve shown you.",
  "",
  "Finally, we’ll introduce you to a few options for using SAP AI services to build and extend your own SAP applications. By the end of this nutshell course, you’ll be able to understand the types and value of different kinds of AI and engage more successfully with AI capabilities within your SAP products and solutions.",
  "",
  "Here is what some participants are saying about the course:",
  "",
  "“This course is designed in such a way that it can be completed by any professional with a very small commitment to course videos and quizzes. It is very informative, especially in learning how SAP architecture enhances GenAI consumption by mitigating grounding methods and using business data to obtain the most efficient response for SAP users.” Read the original post",
  "",
  "“Very informative and well-organized course!!” Read the original post",
  "",
  "“I like this initial intro into GenAI, and what it means in the context of SAP.”… “I liked the slicing of the course and unit length, and very much appreciate that this can be done as a matter of roughly 2h!” Read the original post",
  "",
  "“Excellent Presentation with Clarity and Precision by Sean, Hadi and Jana - Thanks.” Read the original post",
  "",
  "“Thank you for this great opportunity to learn more about the SAP AI Strategy and Features / Solutions in context of business. The level of explanation was great to get the idea of embedding AI services especially GenAI in to enterprise business applications to generate business relevant and accurate output through grounding techniques etc. I really enjoyed this free course and hope to you will release similar courses in the future. Thank you!” Read the original post",
  "",
  "“This course is amazing with precise content and speed, I liked the way it was structured and presented by all the speakers :-)” Read the original post",
  "",
  "Course Characteristics",
  "Reopening from January 29 to June 5, 2024",
  "Starting from: November 14, 2023, 09:00 UTC. (What does this mean?)",
  "Effort: 2-3 hours in total",
  "Course assignment: You can take the course assignment at any time whilst the course is open.",
  "Course closure: December 20, 2023, 9:00 UTC",
  "Course language: English",
  "How is an openSAP course structured?",
  "Course Content",
  "",
  "Unit 1: Approaches to artificial intelligence",
  "Unit 2: Introduction to generative AI",
  "Unit 3: Adapting generative AI to business context",
  "Unit 4: Extending SAP applications with generative AI",
  "Unit 5: Generative AI business use cases",
  "Course assignment",
  "",
  "Target Audience",
  "Artificial intelligence (AI) stakeholders who develop, introduce, or use AI and generative AI models in their organization, both outside and inside of SAP",
  "SAP customers, partners, and internal employees",
  "Anyone interested in the topics of AI and generative AI",
  "Course Requirements",
  "",
  "Interest in artificial intelligence and generative AI",
  "",
  "Further Learning",
  "",
  "To learn more about AI Ethics, we highly recommend to visit this openSAP course",
  "",
  "About Further Content Expert",
  "Matthias Sessler",
  "",
  "Dr. Matthias Sessler has been leading AI Learning & Events at SAP since 2021. He has more than 20 years of experience in SAP technology and has held various positions in presales, software development, and product management.",
  "Matthias also lectures on AI at Bitkom Akademie. He earned his PhD in physics at CERN in collaboration with the University of Heidelberg, where he already came into contact with neural networks for vision tasks.",
];

function extractCourseDuration(courseInfo) {
  const startIndex = courseInfo.indexOf("Course Characteristics");

  if (startIndex !== -1) {
    let endIndex = startIndex + 1;
    while (
      endIndex < courseInfo.length &&
      courseInfo[endIndex] !== "Course Content"
    ) {
      endIndex++;
    }

    const courseDetails = courseInfo.slice(startIndex + 1, endIndex);
    const durationIndex = courseDetails.findIndex((element) =>
      element.includes("Duration:")
    );
    const effortIndex = courseDetails.findIndex((element) =>
      element.includes("Effort:")
    );

    const duration =
      durationIndex !== -1
        ? courseDetails[durationIndex].split(":")[1].trim()
        : null;
    const effort =
      effortIndex !== -1
        ? courseDetails[effortIndex].split(":")[1].trim()
        : null;

    return calculateCourseDuration(duration, effort);
  } else {
    return '"Course Characteristics" section not found';
  }
}

function calculateCourseDuration(dur, pace) {
  if (!dur && pace && pace.includes("hours") && pace.includes("total")) {
    let hours = pace.match(/\d+(?= hours)/)[0];
    var duration = hours;
    return new String(duration).length === 1
      ? `0${duration}:00`
      : `${duration}:00`;
  } else {
    if (dur.match(/hour(s)?/) && dur.match(/week(s)?/)) {
      let weeks = dur.match(/\d+(?= week)/)[0];
      let hours = dur.match(/\d+(?= hours)/)[0];
      var duration = weeks * hours;
      return new String(duration).length === 1
        ? `0${duration}:00`
        : `${duration}:00`;
    } else {
      let weeks = dur.match(/\d+(?= week)/)[0];
      let hours = pace.match(/\d+(?= hours)/)[0];
      var duration = weeks * hours;
      return new String(duration).length === 1
        ? `0${duration}:00`
        : `${duration}:00`;
    }
  }
}

console.log(extractCourseDuration(info));
