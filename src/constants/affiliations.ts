type Affiliation = {
  name: string,
  course: string,
  start: Date,
  end: Date,
  link: string
};

export const affiliations: Affiliation[] = [
  {
    name: "Osaka Metropolitan University College of Technology",
    course: "Electronics and Information Course",
    start: new Date("2021/05/"), // 2021/04
    end: new Date("2026/04"), // 2026/03
    link: "https://www.ct.omu.ac.jp/courses/electronics-and-information-course/"
  }
];
