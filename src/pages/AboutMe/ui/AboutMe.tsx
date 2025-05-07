import React from "react";
import List from "@/shared/ui/List/List";
import AnimatedContent from "@/shared/ui/AnimatedContent/AnimatedContent";

type Section =
    | { label: string; bullets: string[] }
    | { label: string; text: string };

type SectionProps = {
    section: Section;
    delay: number;
};

const data: Section[] = [
    {
        label: "who",
        bullets: [
            "Kyure_A / キュレェ",
            "INTP-T"
        ],
    },
    {
        label: "where",
        bullets: [
            "Osaka, Japan"
        ],
    },
    {
        label: "what",
        bullets: [
            "Emacs が好きです。7 年くらい使っています",
            "ローグライクをよくやります"
        ],
    }
] as const;

function Section(props: SectionProps) {
    return (
        <AnimatedContent delay={props.delay}>
          <React.Fragment key={props.section.label}>
            <h3 className="md:col-span-3 font-mono text-gray-400 text-right md:text-left">
              {props.section.label}
            </h3>
            <article className="md:col-span-9 prose prose-invert max-w-none">
              {"bullets" in props.section ? (
                  <List items={props.section.bullets} />
              ) : (
                  <p>{props.section.text}</p>
              )}
            </article>
          </React.Fragment>
          
        </AnimatedContent>
    )
}

export default function AboutMe() {
    return (
        <>
        <section className="py-24 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-12 gap-y-12">
            {data.map((section, index) => (
                <Section section={section} delay={index * 100} key={section.label} />
            )
            )}
          </div>
        </section>
        </>
    );
}
