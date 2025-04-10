import ASCIIText from "@/shared/ui/ASCIIText/ASCIIText";
import Balatro from "@/shared/ui/Balatro/Balatro";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
    const [isEnglish, setIsEnglish] = useState(true);
    useEffect(() => {
        const timer = setInterval(() => {
            setIsEnglish(previousState => !previousState);
        }, 5000)
        return () => clearInterval(timer);
    }, [])
    
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
            <div className="flex flex-col items-center mb-6">
              <ASCIIText
                  text={ isEnglish ? "Kyure_A" : "キュレェ"}
                  asciiFontSize={12}
                  textFontSize={20}/>
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
