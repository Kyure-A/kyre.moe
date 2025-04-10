import Balatro from "@/shared/ui/Balatro/Balatro";
import Image from "next/image";
import FadeTextRotator from "./FadeTextRotator";

export default function Home() {
    return (
        <div className="relative w-screen h-screen overflow-hidden">
          <div className="absolute inset-0 w-full h-full z-0">
            <Balatro
                pixelFilter={250}
                color1="#272822"
                color2="#F92672"
                color3="#66D9EF"
            />
          </div>
          <div className="absolute flex flex-col z-10 pt-16 inset-0 ">
            <div className="flex flex-col mb-6">
              <FadeTextRotator />
            </div>
            <div className="flex flex-col items-center center">
              <Image
                  alt="Kyure_A"
                  src="/kyre.png"
                  width={1000}
                  height={1000}
              />
            </div>
          </div>
        </div>
    )
}
