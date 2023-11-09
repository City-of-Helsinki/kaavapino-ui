import { useEffect } from "react";

export const OutsideClick = (ref, callback) => {
  const handleClick = e => {
    //Used for fieldset modify button not to close accordian, else if listens to click outside accordian
    if(ref.current.className === "fieldset-main-container" && e.target.textContent === "Muokkaa"){
      return false
    }
    else if (ref.current && !ref.current.contains(e.target)) {
      callback();
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  });
};