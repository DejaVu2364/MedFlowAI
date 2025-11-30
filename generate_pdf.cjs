
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const htmlPath = 'file:///C:/Users/harik/.gemini/antigravity/brain/40801bdd-72fc-491f-851f-89cbdfab06cb/qa_report.html';
    const pdfPath = 'C:/Users/harik/.gemini/antigravity/brain/40801bdd-72fc-491f-851f-89cbdfab06cb/MedFlow_QA_Report.pdf';

    console.log(`Navigating to ${htmlPath}...`);
    await page.goto(htmlPath, { waitUntil: 'networkidle' });

    console.log(`Generating PDF to ${pdfPath}...`);
    await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px'
        }
    });

    console.log('PDF generated successfully.');
    await browser.close();
})();
