import React from "react";
import { m } from "framer-motion";
import { Link } from "react-router-dom";
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Mail,
  Phone,
  ShieldCheck,
  XCircle,
  Info,
} from "lucide-react";

const Section = ({ icon: Icon, title, children, color = "blue" }) => {
  const colors = {
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    green: "text-green-600 bg-green-50 border-green-200",
    red: "text-red-600 bg-red-50 border-red-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    purple: "text-purple-600 bg-purple-50 border-purple-200",
  };
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-8"
    >
      <div
        className={`flex items-center gap-3 mb-3 px-4 py-3 rounded-xl border ${colors[color]}`}
      >
        <Icon className="w-6 h-6 flex-shrink-0" />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="pl-1 text-gray-700 space-y-2">{children}</div>
    </m.div>
  );
};

const BulletItem = ({
  children,
  icon: Icon = CheckCircle,
  color = "text-green-500",
}) => (
  <li className="flex items-start gap-2 py-1">
    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
    <span>{children}</span>
  </li>
);

function ReturnPolicy() {
  return (
    <m.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-gray-50 min-h-screen py-12"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-lg mb-4">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Return & Refund Policy
          </h1>
          <p className="text-gray-500 text-lg">
            TechHub Lesotho — Effective from January 1, 2025
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 md:p-10">
          {/* Intro */}
          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-700 text-lg leading-relaxed mb-10 border-l-4 border-blue-500 pl-4"
          >
            At <strong>TechHub Lesotho</strong>, customer satisfaction is our
            priority. We stand behind every product and service we offer. If
            something isn't right, we'll work with you to make it right. Please
            read this policy carefully before making a purchase.
          </m.p>

          {/* Return Window */}
          <Section icon={Clock} title="Return Window" color="blue">
            <ul className="space-y-1">
              <BulletItem>
                <strong>Physical IT/ICT products</strong> (laptops, networking
                equipment, accessories, peripherals):{" "}
                <strong>7 calendar days</strong> from the date of delivery.
              </BulletItem>
              <BulletItem>
                <strong>Software licenses and digital products</strong>:
                Non-returnable once activated or downloaded.
              </BulletItem>
              <BulletItem>
                <strong>Services</strong> (web hosting, IT support, managed
                services): See the "Services" section below.
              </BulletItem>
            </ul>
          </Section>

          {/* Eligible Returns */}
          <Section icon={CheckCircle} title="Eligible Returns" color="green">
            <p className="mb-2">A product may be returned if:</p>
            <ul className="space-y-1">
              <BulletItem>
                It arrived damaged, defective, or faulty through no fault of
                your own.
              </BulletItem>
              <BulletItem>
                It is significantly different from the product description or
                specifications on our website.
              </BulletItem>
              <BulletItem>
                It is in its <strong>original packaging</strong>, unused, and in
                the same condition it was received.
              </BulletItem>
              <BulletItem>
                All accessories, manuals, and bundled items are included in the
                return.
              </BulletItem>
              <BulletItem>
                The return request is submitted within the 7-day return window.
              </BulletItem>
            </ul>
          </Section>

          {/* Non-Returnable Items */}
          <Section icon={XCircle} title="Non-Returnable Items" color="red">
            <p className="mb-2">
              The following items <strong>cannot</strong> be returned or
              refunded:
            </p>
            <ul className="space-y-1">
              <BulletItem icon={XCircle} color="text-red-500">
                Software licenses (once activated or provided as a download
                key).
              </BulletItem>
              <BulletItem icon={XCircle} color="text-red-500">
                Products with broken seals or tampered packaging (unless faulty
                on arrival).
              </BulletItem>
              <BulletItem icon={XCircle} color="text-red-500">
                Items showing signs of physical damage caused by the customer
                (drops, liquid damage, etc.).
              </BulletItem>
              <BulletItem icon={XCircle} color="text-red-500">
                Consumables (ink cartridges, printer paper, USB sticks) once
                opened.
              </BulletItem>
              <BulletItem icon={XCircle} color="text-red-500">
                Items returned after the 7-day return window without prior
                approval.
              </BulletItem>
              <BulletItem icon={XCircle} color="text-red-500">
                Custom-ordered or specially configured equipment ordered on your
                specification.
              </BulletItem>
            </ul>
          </Section>

          {/* Services Policy */}
          <Section
            icon={ShieldCheck}
            title="Services & Digital Subscriptions"
            color="purple"
          >
            <ul className="space-y-1">
              <BulletItem>
                <strong>Web Hosting Plans:</strong> Eligible for a full refund
                if cancelled within <strong>48 hours</strong> of purchase,
                provided the hosting account has not been actively used.
              </BulletItem>
              <BulletItem>
                <strong>IT Support / Managed Services:</strong> Services already
                rendered are non-refundable. If a service has been partially
                delivered, a pro-rated refund may be considered at our
                discretion.
              </BulletItem>
              <BulletItem>
                <strong>Courses and Training:</strong> Refundable within 48
                hours of purchase if no modules have been accessed. Once course
                materials are accessed, no refund is available.
              </BulletItem>
              <BulletItem>
                <strong>API Keys and Cloud Services:</strong> Non-refundable
                once provisioned.
              </BulletItem>
            </ul>
          </Section>

          {/* How to Return */}
          <Section icon={Package} title="How to Initiate a Return" color="blue">
            <ol className="space-y-3 list-none">
              {[
                "Contact us via email at returns@techhub.co.ls or call +266 1234 5678 within the return window.",
                "Provide your Order ID, the item(s) you want to return, and the reason for the return.",
                "Our team will review your request within 1–2 business days and issue a Return Merchandise Authorization (RMA) number if approved.",
                "Package the product securely in its original packaging and include the RMA number on the outside of the package.",
                "Ship the product to our address in Maseru. Return shipping costs are the responsibility of the customer unless the product was delivered faulty.",
                "Once received and inspected, your refund or replacement will be processed within 5–7 business days.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Refunds */}
          <Section icon={RotateCcw} title="Refund Processing" color="green">
            <ul className="space-y-1">
              <BulletItem>
                Approved refunds are processed within{" "}
                <strong>5–7 business days</strong> after we receive and inspect
                the returned item.
              </BulletItem>
              <BulletItem>
                Refunds are issued to the original payment method used at the
                time of purchase.
              </BulletItem>
              <BulletItem>
                Cash refunds for walk-in purchases are available at our Maseru
                store during business hours.
              </BulletItem>
              <BulletItem>
                For mobile money (M-Pesa, EcoCash) payments, refunds will be
                transferred back to the same number within 3 business days of
                approval.
              </BulletItem>
            </ul>
          </Section>

          {/* Exchanges */}
          <Section icon={Info} title="Exchanges" color="amber">
            <ul className="space-y-1">
              <BulletItem icon={Info} color="text-amber-500">
                We offer <strong>exchanges</strong> for defective or incorrect
                items. The replacement item will be dispatched once the original
                is received and inspected.
              </BulletItem>
              <BulletItem icon={Info} color="text-amber-500">
                If the exact item is no longer available, a store credit or
                refund of equivalent value will be offered.
              </BulletItem>
            </ul>
          </Section>

          {/* Warranty */}
          <Section icon={AlertTriangle} title="Warranty Claims" color="amber">
            <p className="mb-2">
              Many of our products come with manufacturer warranties. If a
              product develops a fault outside of our 7-day return window but
              within the manufacturer's warranty period:
            </p>
            <ul className="space-y-1">
              <BulletItem icon={AlertTriangle} color="text-amber-500">
                Contact us and we will assist you in processing a warranty claim
                with the manufacturer.
              </BulletItem>
              <BulletItem icon={AlertTriangle} color="text-amber-500">
                Warranty does not cover accidental damage, water damage, or
                damage caused by unauthorized repairs or modifications.
              </BulletItem>
            </ul>
          </Section>

          {/* Contact */}
          <div className="mt-10 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-blue-800 mb-3">Need Help?</h3>
            <p className="text-blue-700 mb-4">
              Our support team is here to help you. Reach out through any of the
              following:
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-800">
                <Mail className="w-5 h-5" />
                <a
                  href="mailto:returns@techhub.co.ls"
                  className="underline hover:text-blue-600"
                >
                  returns@techhub.co.ls
                </a>
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <Phone className="w-5 h-5" />
                <a
                  href="tel:+26612345678"
                  className="underline hover:text-blue-600"
                >
                  +266 1234 5678
                </a>
              </div>
            </div>
            <p className="mt-4 text-sm text-blue-600">
              Business Hours: Monday – Friday, 8:00 AM – 5:00 PM (SAST)
            </p>
          </div>

          {/* Related Links */}
          <div className="mt-8 text-sm text-gray-500 text-center">
            <p>
              Also see our{" "}
              <Link
                to="/privacy-policy"
                className="text-blue-600 hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                to="/terms-of-service"
                className="text-blue-600 hover:underline"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </m.div>
  );
}

export default ReturnPolicy;
