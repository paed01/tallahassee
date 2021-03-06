"use strict";

const app = require("../app/app");
const Browser = require("../");
const Script = require("@bonniernews/wichita");
const {IntersectionObserver} = require("../lib");

describe("IntersectionObserver", () => {
  it("observes elements", async () => {
    const browser = await Browser(app).navigateTo("/", {
      Cookie: "_ga=1"
    });
    const intersectionObserver = browser.window.IntersectionObserver = IntersectionObserver(browser);

    await Script("../app/assets/scripts/main").run(browser.window);

    expect(intersectionObserver._getObserved()).to.have.length(1);
    expect(browser.window.IntersectionObserverEntry).to.exist;
    expect(browser.window.IntersectionObserverEntry.prototype.intersectionRatio).to.exist;
    expect(browser.window.IntersectionObserverEntry.prototype.isIntersecting).to.exist;
  });

  it("listens to window scroll", async () => {
    const browser = await Browser(app).navigateTo("/", {
      Cookie: "_ga=1"
    });
    browser.window.IntersectionObserver = IntersectionObserver(browser);

    const lazyLoadElements = browser.document.getElementsByClassName("lazy-load");

    expect(lazyLoadElements.length).to.equal(1);

    await Script("../app/assets/scripts/main").run(browser.window);

    browser.setElementsToScroll(() => {
      return lazyLoadElements;
    });

    const lazyLoadElement = lazyLoadElements[0];
    browser.scrollToTopOfElement(lazyLoadElement);
    expect(lazyLoadElement.classList.contains("lazy-load")).to.be.false;

    expect(browser.document.getElementsByTagName("img")[1].src).to.be.ok;
  });

  it("calls viewPortUpdate with correct element when observing new elements", async () => {
    const browser = await Browser(app).navigateTo("/");
    const [element1] = browser.document.getElementsByClassName("observer-test-1");
    const [element2] = browser.document.getElementsByClassName("observer-test-2");

    browser.window.IntersectionObserver = IntersectionObserver(browser);
    let intersectingEntries = [];

    const observer = browser.window.IntersectionObserver((entries) => {
      intersectingEntries = entries.slice();
    });

    observer.observe(element1);

    expect(intersectingEntries).to.have.length(1);
    expect(intersectingEntries[0]).to.have.property("target", element1);

    observer.observe(element2);

    expect(intersectingEntries).to.have.length(1);
    expect(intersectingEntries[0]).to.have.property("target", element2);
  });

  it("calls viewPortUpdate with correct element when scrolling", async () => {
    const browser = await Browser(app).navigateTo("/");
    browser.window._resize(1024, 768);
    const [element1] = browser.document.getElementsByClassName("observer-test-1");
    const [element2] = browser.document.getElementsByClassName("observer-test-2");

    element1._setBoundingClientRect({ top: 200, bottom: 300 });
    element2._setBoundingClientRect({ top: 400, bottom: 500 });

    browser.setElementsToScroll(() => [element1, element2]);

    browser.window.IntersectionObserver = IntersectionObserver(browser);
    let intersectingEntries = [];
    let timesCalled = 0;

    const observer = browser.window.IntersectionObserver((entries) => {
      intersectingEntries = entries.slice();
      timesCalled++;
    }, { rootMargin: "10px 0 10px" });

    observer.observe(element1);
    observer.observe(element2);
    timesCalled = 0;
    intersectingEntries.length = 0;

    browser.scrollToTopOfElement(element1);

    expect(timesCalled).to.equal(0);
    expect(intersectingEntries).to.be.empty;

    browser.scrollToTopOfElement(element1, -11);

    expect(timesCalled).to.equal(1);
    expect(intersectingEntries).to.have.length(1);
    expect(intersectingEntries[0]).to.have.property("target", element1);

    browser.scrollToTopOfElement(element2);
    timesCalled = 0;
    intersectingEntries.length = 0;

    browser.scrollToTopOfElement(element2, -11);

    expect(timesCalled).to.equal(1);
    expect(intersectingEntries).to.have.length(1);
    expect(intersectingEntries[0]).to.have.property("target", element2);

    timesCalled = 0;
    intersectingEntries.length = 0;

    browser.scrollToTopOfElement(element1);
    expect(timesCalled).to.equal(1);
    expect(intersectingEntries).to.have.length(2);
    expect(intersectingEntries[0]).to.have.property("target", element1);
    expect(intersectingEntries[1]).to.have.property("target", element2);
  });
});
