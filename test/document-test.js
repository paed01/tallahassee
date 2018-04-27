"use strict";

const {Document} = require("../lib");

describe("Document", () => {
  let document;
  beforeEach(() => {
    document = Document({
      request: {
        header: {
          cookie: "_ga=1",
          referer: "referer.url"
        },
        url: "https://www.expressen.se/nyheter/article-slug/"
      },
      text: `
        <html>
          <body>
            <h2 id="headline">Test</h2>
            <input type="button"
            <script>var a = 1;</script>
            <template id="schablon" data-json="{&quot;json&quot;:&quot;&#xE5;&#xE4;&#xF6; in top document child&quot;}">
              <div id="insert" data-json="{&quot;json&quot;:&quot;&#xE5;&#xE4;&#xF6; in sub document child&quot;}">
                <p>In a template</p>
              </div>
            </template>
            <div id="lazy"></div>
          </body>
        </html>`
    });
  });

  describe("properties", () => {
    it("has location", () => {
      expect(document.location).to.be.ok;
      expect(document.location).to.have.property("host", "www.expressen.se");
      expect(document.location).to.have.property("pathname", "/nyheter/article-slug/");
    });

    it("doesn't expose classList on document", async () => {
      expect(document.classList, "classList on document").to.be.undefined;
    });

    it("exposes documentElement with expected behaviour", async () => {
      expect(document.documentElement).to.have.property("tagName", "HTML");
    });
  });

  describe("api", () => {
    it("getElementById returns element if found", async () => {
      const elm = document.getElementById("headline");
      expect(elm).to.be.ok;
      expect(elm.getElementById, "getElementById on element").to.be.undefined;
    });

    it("getElementById returns null id element is not found", async () => {
      expect(document.getElementById("non-existing")).to.be.null;
    });
  });

  describe("createDocumentFragment()", () => {
    it("returns a document object with functions", () => {
      const fragment = document.createDocumentFragment();

      expect(fragment).to.be.ok;
      expect(fragment).to.have.property("appendChild").that.is.a("function");
    });
  });

  describe("importNode()", () => {
    it("importNode() returns clone of element without content", () => {
      const elm = document.getElementById("headline");
      const elmClone = document.importNode(elm);
      expect(elmClone.outerHTML).to.equal("<h2 id=\"headline\"></h2>");
      expect(elm.outerHTML === elmClone.outerHTML).to.be.false;
      expect(elm === elmClone).to.be.false;
    });

    it("importNode() with deep parameter returns clone of element with content", () => {
      const elm = document.getElementById("headline");
      const elmClone = document.importNode(elm, true);
      expect(elmClone.outerHTML).to.equal("<h2 id=\"headline\">Test</h2>");
      expect(elm.outerHTML === elmClone.outerHTML).to.be.true;
      expect(elm === elmClone).to.be.false;
    });

    it("importNode() on templateElement.content combined with appendChild() inserts element content", async () => {
      const templateElement = document.getElementById("schablon");
      const templateContentClone = document.importNode(templateElement.content, true);

      expect(document.getElementById("insert")).not.to.be.ok;

      document.getElementById("lazy").appendChild(templateContentClone);

      console.log(document.getElementById("lazy").outerHTML);
      expect(document.getElementById("insert")).to.be.ok;
      expect(document.getElementById("insert").parentElement.id).to.equal("lazy");
    });

    it("handles JSON in attributes in top document and sub documents", () => {
      const topDocChild = document.getElementById("schablon");
      const templateContentClone = document.importNode(topDocChild.content, true);

      const lazyContainer = document.getElementById("lazy");
      lazyContainer.appendChild(templateContentClone);
      const subDocChildInTopDoc = lazyContainer.lastElementChild;

      expect(() => JSON.parse(topDocChild.dataset.json)).not.to.throw();
      const topDocJSON = JSON.parse(topDocChild.dataset.json);
      expect(topDocJSON).to.eql({"json": "åäö in top document child"});

      expect(() => JSON.parse(subDocChildInTopDoc.dataset.json)).not.to.throw();
      const subDocInTopDocJSON = JSON.parse(subDocChildInTopDoc.dataset.json);
      expect(subDocInTopDocJSON).to.deep.equal({"json": "åäö in sub document child"});
    });
  });

  describe("createTextNode()", () => {
    it("returns a text node", () => {
      const textNode = document.createTextNode("test");
      expect(textNode.textContent === "test");
    });

    it("TextNode is appended to parent element", () => {
      const parent = document.createElement("span");
      const textNode = document.createTextNode("test");
      parent.appendChild(textNode);

      document.body.appendChild(parent);
      const span = document.getElementsByTagName("span")[0];

      expect(span.outerHTML).to.equal("<span>test</span>");
    });
  });

  describe("_getElement()", () => {
    it("returns the same element when called twice", () => {
      const $ = document.$;
      const call1 = document._getElement($("#headline"));
      const call2 = document._getElement($("#headline"));

      expect(call1 === call2).to.be.true;
    });
  });

  describe("cookie", () => {
    it("has cookie", () => {
      expect(document.cookie).to.be.ok;
    });

    it("can set cookie", () => {
      document.cookie = "_new=2";
      expect(document.cookie).to.equal("_ga=1;_new=2;");
    });

    it("overwrites cookie with same name", () => {
      document.cookie = "_writable=2";
      document.cookie = "_writable=3";
      expect(document.cookie).to.equal("_ga=1;_writable=3;");
    });

    it("URI encodes when setting value", () => {
      document.cookie = "_writable=2 3";
      expect(document.cookie).to.equal("_ga=1;_writable=2%203;");
    });

    it("can set cookie value to blank", () => {
      document.cookie = "_writable=4";
      expect(document.cookie).to.equal("_ga=1;_writable=4;");

      document.cookie = "_writable=";
      expect(document.cookie).to.equal("_ga=1;_writable=;");

      document.cookie = "_writable=44 ";
      expect(document.cookie).to.equal("_ga=1;_writable=44;");
    });
  });

  describe("referrer", () => {
    it("has referer", () => {
      expect(document.referrer).to.be.ok;
    });

    it("has a url", () => {
      expect(document.referrer).to.equal("referer.url");
    });
  });

  describe("nodeType", () => {
    it("should return the correct node type", () => {
      expect(document.nodeType).to.equal(9);
    });
  });
});
