let info = [
  "Free Online Course (Audit)",
  "Paid Certificate Available",
  "11 hours",
  "On-Demand",
  "Beginner",
  "Arabic, French, Portuguese, Italian, German, Russian, English, Spanish, Thai, Indonesian, Kazakh, Hindi, Swedish, Korean, Greek, Chinese, Ukrainian, Japanese, Polish, Dutch, Turkish, Hungarian, Bengali, Pashto, Urdu, Azerbaijani, Farsi",
];

infos = info.filter((el) => el.match(/hour(s)?/));
let dur1 = "11 hours";
let dur2 = "6 weeks, 4-6 hours a week";

function calculateCourseDuration(dur) {
  if (dur.match(/week(s)?/) && dur.match(/hour(s)?/)) {
    let weeks = dur.match(/\d+(?= week)/)[0];
    let hours = dur.match(/\d+(?= hours)/)[0];
    let duration = weeks * hours;
    return new String(duration).length === 1
      ? `0${duration}:00`
      : `${duration}:00`;
  } else if (dur.match(/hour(s)?/)) {
    let duration = dur.match(/\d+(?= hours)/)[0];
    return new String(duration).length === 1
      ? `0${duration}:00`
      : `${duration}:00`;
  } else {
    return "00:00";
  }
}
console.log(calculateCourseDuration(dur1));
console.log(calculateCourseDuration(dur2));

// calculateCourseDuration(dur, pace) {
//   if (!dur && pace && pace.includes("hours") && pace.includes("total")) {
//     let hours = pace.match(/\d+(?= hours)/)[0];
//     var duration = hours;
//     return new String(duration).length === 1
//       ? `0${duration}:00`
//       : `${duration}:00`;
//   } else {
//     if (dur.match(/hour(s)?/) && dur.match(/week(s)?/)) {
//       let weeks = dur.match(/\d+(?= week)/)[0];
//       let hours = dur.match(/\d+(?= hours)/)[0];
//       var duration = weeks * hours;
//       return new String(duration).length === 1
//         ? `0${duration}:00`
//         : `${duration}:00`;
//     } else {
//       let weeks = dur.match(/\d+(?= week)/)[0];
//       let hours = pace.match(/\d+(?= hours)/)[0];
//       var duration = weeks * hours;
//       return new String(duration).length === 1
//         ? `0${duration}:00`
//         : `${duration}:00`;
//     }
//   }
