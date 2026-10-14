import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDoc } from "@/components/LegalDoc";
import { pageHead } from "@/lib/site";

export const Route = createFileRoute("/acceptable-use")({
  head: () => pageHead("Acceptable Use Policy", "What you can and cannot upload or share on Tanyora, and what happens when the rules are broken.", "/acceptable-use"),
  component: AUP,
});

function AUP() {
  return (
    <LegalDoc
      title="Acceptable Use Policy"
      intro={<p>This policy explains what is not allowed on Tanyora. It is part of our <Link to="/terms">Terms of Service</Link> and follows the Information Technology Act, 2000, the IT Rules, 2021, the Bharatiya Nyaya Sanhita, 2023, the Copyright Act, 1957 and the POCSO Act, 2012. If you are unsure whether something is allowed, do not upload it.</p>}
      summary={[
        "Only upload files you own or have the right to share.",
        "Illegal, sexual, abusive, violent, pirated or harmful content is removed.",
        "Breaking these rules can lead to a permanent ban, loss of rewards and a police report.",
      ]}
      sections={[
        { id: "illegal", title: "Illegal and harmful content", body: <ul><li>Child sexual abuse material or any sexualisation of minors — see <Link to="/child-safety">Child Safety Standards</Link>.</li><li>Pornography, obscene or sexually explicit material (IT Act Sections 67 and 67A).</li><li>Intimate images shared without consent, voyeurism, morphed or deepfake sexual content.</li><li>Terrorism, extremist propaganda, recruitment, or instructions for weapons or explosives.</li><li>Content that threatens India's sovereignty, integrity, security or public order, or incites any offence.</li><li>Sale or promotion of drugs, weapons, counterfeit goods, human trafficking or any illegal goods or services.</li><li>Illegal gambling, betting or money-laundering schemes.</li></ul> },
        { id: "ip", title: "Piracy and intellectual property", body: <p>Do not share movies, web series, TV shows, cricket or sports streams, music, paid courses, e-books, software, cracked apps, games or any work you do not own or have a licence for. Do not use others' trademarks or logos in a misleading way. See the <Link to="/copyright">Copyright Policy</Link>.</p> },
        { id: "abuse", title: "Abuse of people", body: <ul><li>Harassment, bullying, threats, or content that insults or degrades people based on religion, caste, race, gender, disability or sexual orientation.</li><li>Sharing someone's private information (phone, address, ID documents, bank details) without consent.</li><li>Impersonating any person, brand or government body.</li><li>Promotion of self-harm, suicide or eating disorders.</li><li>Graphic violence or gore shared to shock or glorify.</li></ul> },
        { id: "fraud", title: "Fraud, malware and misinformation", body: <ul><li>Phishing pages, scams, fake job or investment offers, loan fraud.</li><li>Viruses, malware, spyware or any harmful code.</li><li>Patently false or misleading information, or anything marked fake by the Government of India's Fact Check Unit.</li></ul> },
        { id: "platform", title: "Abuse of the platform", body: <ul><li>Fake views, bot traffic, self-clicking, view exchanges or incentivised clicks.</li><li>Multiple accounts, fake referrals or signing up yourself through your own link.</li><li>Hacking, scraping, overloading, bypassing limits, or testing security without following our <Link to="/security">disclosure policy</Link>.</li><li>Using Tanyora as a file host for spam or for illegal sites.</li></ul> },
        { id: "enforcement", title: "Enforcement", body: <><p>We may act on our own review, a user report, a rights-holder notice, or a court or government order. Actions include warning, content removal, upload restriction, reward freezing or forfeiture, suspension, permanent ban, evidence preservation and reporting to the authorities. Severe violations (CSAM, terrorism, non-consensual intimate images) lead to an immediate permanent ban.</p><p>If you think we made a mistake, contact the <Link to="/grievance">Grievance Officer</Link>.</p></> },
        { id: "report", title: "Report a violation", body: <p>Use <Link to="/content-reporting">Report content</Link> or the Report button under any file in the app.</p> },
      ]}
    />
  );
}
