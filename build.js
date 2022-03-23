const { firefox } = require("playwright-firefox");
const showdown = require("showdown");
const fs = require("fs");

async function translatePage(page) {
  let html = await page.evaluate(() => {
    function styleElements() {
      for (let el of [...document.querySelectorAll("ul")]) {
        el.classList.add("mzp-u-list-styled");
      }
      for (let el of [...document.querySelectorAll("h2, h3, h4")]) {
        if (!el.id) {
          continue;
        }
        let wrapper = document.createElement("a");
        wrapper.href = `#${el.id}`;
        wrapper.className = "protosite-pattern-anchor";
        wrapper.append(...el.childNodes);
        el.append(wrapper);
      }
    }

    styleElements();

    return document.body.innerHTML;
  });
  return html;
}

/*
<h4 class="protosite-nav-menu-title">Pursuing these values</h4>
<ul>
  <li class="protosite-nav-main-item"><a href="#">Privacy</a></li>
  <li class="protosite-nav-main-item"><a href="#">Browser Security</a></li>
</ul>
*/
async function buildTableOfContents(page) {
  let html = await page.evaluate(() => {
    let html = [];
    let headings = [...document.querySelectorAll("h2, h3")];
    for (let i = 0; i < headings.length; i++) {
      let el = headings[i];
      if (el.tagName == "H2") {
        html.push(
          `<h4 class="protosite-nav-menu-title"><a href="#${el.id || ""}">${
            el.textContent
          }</a></h4>`
        );
      } else {
        if (headings[i - 1] && headings[i - 1].tagName == "H2") {
          html.push("<ul>\n");
        }
        html.push(`
        <li class="protosite-nav-main-item">
          <a href="#${el.id || ""}">${el.textContent}</a>
        </li>
      `);

        if (headings[i + 1] && headings[i + 1].tagName == "H2") {
          html.push("</ul>\n");
        }
      }
    }

    return html.join("");
  });

  return html;
}

(async () => {
  let converter = new showdown.Converter();
  converter.setOption("headerLevelStart", 2);

  let summary = fs.readFileSync("input/summary.md", "utf8");
  let full = fs.readFileSync("input/full.md", "utf8");

  if (!fs.existsSync("build")) {
    fs.mkdirSync("build");
  }

  fs.writeFileSync("build/summary-generated.html", converter.makeHtml(summary));
  fs.writeFileSync("build/full-generated.html", converter.makeHtml(full));

  const browser = await firefox.launch();
  const page = await browser.newPage();

  await page.goto(`file://${__dirname}/build/full-generated.html`);
  let fullHTML = await translatePage(page);
  let fullTableOfContents = await buildTableOfContents(page);

  await page.goto(`file://${__dirname}/build/summary-generated.html`);
  let summaryHTML = await translatePage(page);

  await browser.close();

  let outputSummaryHTML = fs.readFileSync(`docs/index.html`, "utf8");
  let outputFullHTML = fs.readFileSync(`docs/full/index.html`, "utf8");

  var newOutputSummaryHTML =
    outputSummaryHTML.split("<!-- CONTENTS -->")[0] + "<!-- CONTENTS -->\n";
  newOutputSummaryHTML += summaryHTML;
  newOutputSummaryHTML +=
    "\n<!-- END CONTENTS -->" +
    outputSummaryHTML.split("<!-- END CONTENTS -->")[1];
  fs.writeFileSync("docs/index.html", newOutputSummaryHTML);

  var newOutputFullHTML =
    outputFullHTML.split("<!-- CONTENTS -->")[0] + "<!-- CONTENTS -->\n";
  newOutputFullHTML += fullHTML;
  newOutputFullHTML +=
    "\n<!-- END CONTENTS -->" +
    outputFullHTML.split("<!-- END CONTENTS -->")[1];
  var withToc = newOutputFullHTML.split("<!-- TOC -->")[0] + "<!-- TOC -->\n";
  withToc += fullTableOfContents;
  withToc +=
    "\n<!-- END TOC -->" + newOutputFullHTML.split("<!-- END TOC -->")[1];
  fs.writeFileSync("docs/full/index.html", withToc);
})();
