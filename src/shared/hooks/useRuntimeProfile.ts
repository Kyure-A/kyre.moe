"use client";

import { useEffect, useState } from "react";

type RuntimeProfile = {
  isFirefox: boolean;
  isWindows: boolean;
  isWindowsFirefox: boolean;
  lowPerformanceMode: boolean;
};

const DEFAULT_PROFILE: RuntimeProfile = {
  isFirefox: false,
  isWindows: false,
  isWindowsFirefox: false,
  lowPerformanceMode: false,
};

const useRuntimeProfile = (): RuntimeProfile => {
  const [profile, setProfile] = useState<RuntimeProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const userAgent = navigator.userAgent;
    const isFirefox = /Firefox\/\d+/i.test(userAgent);
    const isWindows = /Windows NT/i.test(userAgent);
    const isWindowsFirefox = isFirefox && isWindows;

    setProfile({
      isFirefox,
      isWindows,
      isWindowsFirefox,
      lowPerformanceMode: isWindowsFirefox,
    });
  }, []);

  return profile;
};

export default useRuntimeProfile;
