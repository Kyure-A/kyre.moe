import InfiniteScroll from "@/blocks/Components/InfiniteScroll/InfiniteScroll";

export default function Accounts () {
    const items = ["hoge", "fuga"].map(x => { return {content: x }})
    
    return (
        <div className="h-full w-full">
          <InfiniteScroll
              items={items}/>
        </div>
    )
}
