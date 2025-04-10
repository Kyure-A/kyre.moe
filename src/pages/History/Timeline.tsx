import React from 'react';

type TimelineItemProps = {
    date: string,
    title: string,
    description: string
}

export type TimelineItem = {
    date: string,
    title: string,
    description: string
}

type TimelineProps = {
    items?: TimelineItem[]
}

const TimelineItem: React.FC<TimelineItemProps> = ({ date, title, description }) => {
    return (
        <div className="flex mb-8 relative z-10">
          {/* 左側の日付部分 */}
          <div className="w-24 text-right pr-4 flex items-center font-medium text-white">
            {date}
          </div>
          
          {/* 中央のドット */}
          <div className="relative flex flex-col items-center">
            <div className="absolute top-1.5 w-4 h-4 rounded-full bg-white border-2 border-white -translate-x-1/2 left-1/2 z-20"></div>
          </div>
          
          {/* 右側のコンテンツ部分 */}
          <div className="pl-4 flex-col">
            <h3 className="font-bold text-white">{title}</h3>
            <p className="text-gray-300 mt-1">{description}</p>
          </div>
        </div>
    );
};


export default function Timeline({ items = [] }: TimelineProps) {
    return (
        <div className="py-4 relative">
          <div className="absolute left-24 top-0 bottom-0 w-px bg-gray-300 z-0"></div>

          {items && items.map((item, index) => (
              <TimelineItem
                  key={index}
                  date={item.date}
                  title={item.title}
                  description={item.description}
              />
          ))}
        </div>
    );
};
