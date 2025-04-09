import Balatro from "@/blocks/Backgrounds/Balatro/Balatro";
import ASCIIText from "@/blocks/TextAnimations/ASCIIText/ASCIIText";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home () {
    const [isEnglish, setIsEnglish] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            setIsEnglish(previousState => !previousState);
        }, 5000)

        return () => clearInterval(timer);
    }, [])
    
    return (
        <div className="flex flex-col">
          <div className="flex flex-col items-center">
            <ASCIIText
                text={ isEnglish ? "Kyure_A" : "きゅれぇ"}
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
    )
}
