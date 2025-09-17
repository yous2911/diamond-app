import Hero from "../components/sections/Hero";
import SocialProof from "../components/sections/SocialProof";
import AttentionEconomy from "../components/sections/AttentionEconomy";
import Method from "../components/sections/Method";
import MasteryGuarantee from "../components/sections/MasteryGuarantee";
import ImpactB1G1 from "../components/sections/ImpactB1G1";
import FullPresentation from "../components/sections/FullPresentation";
import Pricing from "../components/sections/Pricing";
import Contract from "../components/sections/Contract";
import FAQ from "../components/sections/FAQ";
import Footer from "../components/sections/Footer";

export default function Home() {
  return (
    <main id="main">
      <Hero />
      <SocialProof />
      <AttentionEconomy />
      <FullPresentation />
      <Method />
      <MasteryGuarantee />
      <ImpactB1G1 />
      <Pricing />
      <Contract />
      <FAQ />
      <Footer />
    </main>
  );
}