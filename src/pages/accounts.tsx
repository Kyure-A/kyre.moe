import InfiniteScroll from "@/blocks/Components/InfiniteScroll/InfiniteScroll";
import Image from "next/image";
import { ReactNode } from "react";
import { FaTwitter } from "react-icons/fa6";

type AccountProps = {
    id: string;
    description: string;
    icon?: ReactNode;
}

function Account (props: AccountProps) {
    return (
        <div className="flex items-center">
          <Image
              className="rounded-lg"
              alt=""
              src="/icon.jpg"
              width={100}
              height={100}
          />
          <div className="flex flex-col">
            <div className="flex items-center">
              {props.icon}
              <p>@{props.id}</p>
            </div>
            <p>{props.description}</p>            
          </div>
        </div>
    );
}

export default function Accounts () {
    return (
        <Account id="Kyure_A" description="suspended" icon={<FaTwitter />}/>
    );
}
