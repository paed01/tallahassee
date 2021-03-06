import {getCookie} from "./cookies";
import lazyLoad from "./lazy-load";

(function IIFE() {
  const cookieVal = getCookie("_ga");

  if (cookieVal) {
    const div = document.createElement("p");
    div.classList.add("set-by-js");
    div.textContent = "some text";
    document.body.appendChild(div);
  }

  lazyLoad();
})();

