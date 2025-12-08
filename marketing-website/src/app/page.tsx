import Hero from "../components/sections/Hero";
import Method from "../components/sections/Method";
import SocialProof from "../components/sections/SocialProof";
import Science from "../components/sections/Science";
import MasteryGuarantee from "../components/sections/MasteryGuarantee";
import ImpactB1G1 from "../components/sections/ImpactB1G1";
import Pricing from "../components/sections/Pricing";
import ProgressionGuarantee from "../components/sections/ProgressionGuarantee";
import FAQ from "../components/sections/FAQ";
import Footer from "../components/sections/Footer";

export default function Home() {
  return (
    <main id="main" className="min-h-screen bg-white">
      <Hero />
      <Method />
      <SocialProof />
      <Science />
      <MasteryGuarantee />
      <ImpactB1G1 />
      <Pricing />
      <ProgressionGuarantee />
      <FAQ />
      <Footer />
    </main>
  );
}