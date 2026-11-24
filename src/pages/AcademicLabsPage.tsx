import { useState, useEffect } from 'react';
import { FileText, Download, Play, ExternalLink, Database, Code2 } from 'lucide-react';
import { apiRequest, formatINR } from '../lib/api';
import { runLab2AsyncAwaitDemo, type Lab2CatalogResult } from '../utils/lab2AsyncCatalog';
import { composeBookingEstimate } from '../utils/lab3BookingSpread';

interface Lab4Report {
  generatedAt: string;
  source: string;
  hotelList: { id: string; name: string; city: string; category: string; startingPrice: number }[];
  bookingSummary: {
    totalBookings: number;
    confirmed: number;
    pending: number;
    completed: number;
    cancelled: number;
    totalEstimatedValueINR: number;
  };
  customerBookingReport: {
    customerName: string;
    city: string;
    totalBookings: number;
    totalEstimatedSpendINR: number;
  }[];
}

interface MongoGuide {
  database: string;
  collection: string;
  note: string;
  commands: { step: string; command: string; explanation: string }[];
}

const WORD_DOCS = [
  {
    type: 'report',
    title: 'Complete BCA Project Report (.docx)',
    desc: 'Ready to submit to Mam: Abstract, Objectives, Architecture, Modules, All 8 KLE Tech Labs, Testing Matrix, Conclusion & 15 Viva Q&As.',
  },
  {
    type: 'backend',
    title: 'Backend Documentation (.docx)',
    desc: 'Node.js, Express REST APIs, built-in HTTP server (Lab 5), bcrypt auth, rate limiting, and atomic JSON locking.',
  },
  {
    type: 'database',
    title: 'Database & JSON Storage Doc (.docx)',
    desc: 'All 7 JSON collections, entity relationships, INR pricing & GST rules, plus Lab 6 MongoDB HotelDB CRUD reference.',
  },
  {
    type: 'frontend',
    title: 'Frontend UI/UX Documentation (.docx)',
    desc: 'Luxury cream & brown palette, Playfair/Plus Jakarta typography, customer/admin dashboards, and Bootstrap 5 Lab 7 & 8 pages.',
  },
];

export function AcademicLabsPage() {
  const [lab2Out, setLab2Out] = useState<{
    promiseFlow: Lab2CatalogResult;
    asyncFlow: Lab2CatalogResult;
  } | null>(null);
  const [lab2Loading, setLab2Loading] = useState(false);

  const [lab4Report, setLab4Report] = useState<Lab4Report | null>(null);
  const [mongoGuide, setMongoGuide] = useState<MongoGuide | null>(null);

  useEffect(() => {
    apiRequest<Lab4Report>('/api/labs/report').then(setLab4Report).catch(() => {});
    apiRequest<MongoGuide>('/api/labs/mongodb-guide').then(setMongoGuide).catch(() => {});
  }, []);

  const executeLab2 = async () => {
    setLab2Loading(true);
    try {
      const result = await runLab2AsyncAwaitDemo();
      setLab2Out(result);
    } finally {
      setLab2Loading(false);
    }
  };

  // Live Lab 3 demonstration
  const lab3Demo = composeBookingEstimate(
    {
      fullName: 'Meera Deshpande',
      email: 'meera.deshpande@example.in',
      mobile: '+91 98801 44556',
    },
    {
      hotelName: 'Deccan Sandalwood Palace',
      roomCategory: 'Suite',
      checkIn: '2026-12-20',
      checkOut: '2026-12-22',
      nights: 2,
      numRooms: 1,
      roomPrice: 15800,
    },
    ['Free Wi-Fi', 'Heritage Courtyard', 'Spa & Wellness'],
    ['Private Verandah', 'Butler Service', 'Free Wi-Fi'],
    1400, // Breakfast add-on via Rest param
    1500 // Airport transfer via Rest param
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 space-y-12">
      {/* Header */}
      <div className="pb-6 border-b border-[#E4D7C5]">
        <p className="text-xs font-semibold text-[#A66A38] mb-1">
          BCA III Semester · KLE Technological University Server-Side Web Development
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-[#2D1D14]">
          Academic Word Documents & All 8 Lab Programs
        </h1>
        <p className="mt-2 text-sm text-[#5A4334] max-w-3xl">
          Download print-ready Microsoft Word (<code>.docx</code>) documentation for faculty
          submission and verify every one of the eight laboratory syllabus programs live inside
          STAYEASE.
        </p>
      </div>

      {/* SECTION 1: MICROSOFT WORD (.DOCX) DOWNLOADS */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#A66A38]" />
          <h2 className="font-display text-2xl font-semibold text-[#2D1D14]">
            Downloadable Word Documents (.docx) for Faculty Review
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WORD_DOCS.map((doc) => (
            <div
              key={doc.type}
              className="p-5 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl flex flex-col justify-between gap-4"
            >
              <div>
                <h3 className="font-display text-lg font-semibold text-[#2D1D14] mb-1">
                  {doc.title}
                </h3>
                <p className="text-sm text-[#6A5344]">{doc.desc}</p>
              </div>
              <div>
                <a
                  href={`/api/docs/download/${doc.type}`}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[#2D1D14] hover:bg-[#4A3426] text-[#FAF6F0] rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Word Document
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 2: LIVE 8 LAB PROGRAMS EXPLORER */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#A66A38]" />
          <h2 className="font-display text-2xl font-semibold text-[#2D1D14]">
            Interactive Eight-Lab Syllabus Verification
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lab 1 */}
          <div className="p-6 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl space-y-2.5">
            <div className="text-xs font-semibold text-[#A66A38]">
              Lab 1 · ES6 Objects, Destructuring, Arrow Functions, Array Methods & Template Literals
            </div>
            <h3 className="font-display text-xl font-semibold text-[#2D1D14]">
              Customer & Booking Details Formatter
            </h3>
            <p className="text-sm text-[#5A4334]">
              Implemented in <code className="font-mono text-xs">src/utils/lab1GuestSummary.ts</code>{' '}
              and actively powers the Customer Dashboard summary card by destructuring user and
              booking records and computing nights and INR totals via <code>filter</code>,{' '}
              <code>map</code>, and <code>reduce</code>.
            </p>
          </div>

          {/* Lab 2 */}
          <div className="p-6 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#A66A38]">
                  Lab 2 · JSON Data Using Promises (resolve/reject, then/catch) & Async/Await
                </div>
                <h3 className="font-display text-xl font-semibold text-[#2D1D14]">
                  Live Hotel & Room JSON Validator
                </h3>
              </div>
              <button
                type="button"
                onClick={executeLab2}
                disabled={lab2Loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#2D1D14] text-[#FAF6F0] rounded-lg cursor-pointer shrink-0"
              >
                <Play className="w-3.5 h-3.5" />
                {lab2Loading ? 'Running...' : 'Run Lab 2'}
              </button>
            </div>
            <p className="text-xs text-[#6A5344]">
              Source: <code className="font-mono">src/utils/lab2AsyncCatalog.ts</code>
            </p>
            {lab2Out && (
              <div className="p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl font-mono text-xs text-[#2D1D14] space-y-1">
                <div>
                  {lab2Out.promiseFlow.mode}: {lab2Out.promiseFlow.hotelCount} hotels,{' '}
                  {lab2Out.promiseFlow.roomCount} rooms · Range{' '}
                  {formatINR(lab2Out.promiseFlow.lowestRateINR)}–
                  {formatINR(lab2Out.promiseFlow.highestRateINR)}
                </div>
                <div>
                  {lab2Out.asyncFlow.mode}: First listing “{lab2Out.asyncFlow.sampleHotelName}”
                  verified at {lab2Out.asyncFlow.verifiedAt}
                </div>
              </div>
            )}
          </div>

          {/* Lab 3 */}
          <div className="p-6 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl space-y-2.5">
            <div className="text-xs font-semibold text-[#A66A38]">
              Lab 3 · Spread & Rest Operators + Array Destructuring
            </div>
            <h3 className="font-display text-xl font-semibold text-[#2D1D14]">
              Booking Object Merge & Variable Charge Summation
            </h3>
            <p className="text-xs text-[#6A5344]">
              Source: <code className="font-mono">src/utils/lab3BookingSpread.ts</code> (used live in
              Hotel Details booking calculator)
            </p>
            <div className="p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl text-xs space-y-1 text-[#2D1D14]">
              <div>
                <strong>Merged Record:</strong> {lab3Demo.combinedRecord.fullName} →{' '}
                {lab3Demo.combinedRecord.hotelName} ({lab3Demo.combinedRecord.roomCategory})
              </div>
              <div className="font-mono">
                Rest Charges Sum: {formatINR(lab3Demo.combinedRecord.additionalCharges)} · Est. Total
                (incl. 12% GST): {formatINR(lab3Demo.combinedRecord.estimatedTotal)}
              </div>
              <div>
                <strong>Destructured Perks:</strong> [1] {lab3Demo.primaryPerk}, [2]{' '}
                {lab3Demo.secondaryPerk} (+{lab3Demo.remainingPerksCount} more via array spread)
              </div>
            </div>
          </div>

          {/* Lab 5, Lab 7, Lab 8 Live Links */}
          <div className="p-6 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl space-y-3">
            <div className="text-xs font-semibold text-[#A66A38]">
              Labs 5, 7 & 8 · Built-in Node HTTP Server & Bootstrap 5 Live Pages
            </div>
            <h3 className="font-display text-xl font-semibold text-[#2D1D14]">
              Open Dedicated Syllabus Endpoints
            </h3>
            <div className="space-y-2.5 pt-1">
              <a
                href="/lab5-http-server"
                className="flex items-center justify-between p-3 bg-[#FAF6F0] border border-[#E4D7C5] hover:border-[#A66A38] rounded-xl text-xs font-semibold text-[#2D1D14]"
              >
                <span>Lab 5: Node.js Built-in HTTP HTML Response & Live Date/Time</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#A66A38]" />
              </a>
              <a
                href="/lab7-register.html"
                className="flex items-center justify-between p-3 bg-[#FAF6F0] border border-[#E4D7C5] hover:border-[#A66A38] rounded-xl text-xs font-semibold text-[#2D1D14]"
              >
                <span>Lab 7: Bootstrap 5 Responsive Customer Registration Form</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#A66A38]" />
              </a>
              <a
                href="/lab8-events.html"
                className="flex items-center justify-between p-3 bg-[#FAF6F0] border border-[#E4D7C5] hover:border-[#A66A38] rounded-xl text-xs font-semibold text-[#2D1D14]"
              >
                <span>Lab 8: Bootstrap 5 Promotional Event Modal & JSON Persistence</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#A66A38]" />
              </a>
            </div>
          </div>
        </div>

        {/* Lab 4 Live Node.js fs.promises JSON Report */}
        {lab4Report && (
          <div className="p-6 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[#A66A38]">
                  Lab 4 · Read JSON File Using Node.js (fs.promises + async/await + Error Handling)
                </div>
                <h3 className="font-display text-2xl font-semibold text-[#2D1D14]">
                  Live Server-Generated JSON Report
                </h3>
                <p className="text-xs text-[#6A5344]">
                  Fetched from <code className="font-mono">GET /api/labs/report</code> · Generated{' '}
                  {new Date(lab4Report.generatedAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => apiRequest<Lab4Report>('/api/labs/report').then(setLab4Report).catch(() => {})}
                className="px-3 py-1.5 text-xs font-semibold bg-[#FAF6F0] border border-[#D9C7B2] hover:bg-[#F2EAE0] text-[#2D1D14] rounded-lg cursor-pointer"
              >
                Refresh JSON Report
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl">
                <div className="text-xs text-[#8C7561]">Hotels Loaded</div>
                <div className="font-mono text-xl font-semibold tabular-nums">
                  {lab4Report.hotelList.length}
                </div>
              </div>
              <div className="p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl">
                <div className="text-xs text-[#8C7561]">Total Bookings</div>
                <div className="font-mono text-xl font-semibold tabular-nums">
                  {lab4Report.bookingSummary.totalBookings}
                </div>
              </div>
              <div className="p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl">
                <div className="text-xs text-[#8C7561]">Confirmed / Completed</div>
                <div className="font-mono text-xl font-semibold tabular-nums">
                  {lab4Report.bookingSummary.confirmed} / {lab4Report.bookingSummary.completed}
                </div>
              </div>
              <div className="p-3.5 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl">
                <div className="text-xs text-[#8C7561]">Est. Portfolio Value</div>
                <div className="font-mono text-xl font-semibold tabular-nums">
                  {formatINR(lab4Report.bookingSummary.totalEstimatedValueINR)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4D7C5] text-[#8C7561]">
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">City</th>
                    <th className="py-2 pr-4 text-right">Bookings</th>
                    <th className="py-2 text-right">Estimated Spend (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE5D8]">
                  {lab4Report.customerBookingReport.map((row) => (
                    <tr key={row.customerName}>
                      <td className="py-2 pr-4 font-medium text-[#2D1D14]">{row.customerName}</td>
                      <td className="py-2 pr-4 text-[#6A5344]">{row.city}</td>
                      <td className="py-2 pr-4 text-right font-mono tabular-nums">
                        {row.totalBookings}
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums font-semibold">
                        {formatINR(row.totalEstimatedSpendINR)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lab 6 MongoDB Practical Guide */}
        {mongoGuide && (
          <div className="p-6 bg-[#FFFDF9] border border-[#E4D7C5] rounded-2xl space-y-4">
            <div className="flex items-start gap-2.5">
              <Database className="w-5 h-5 text-[#A66A38] shrink-0 mt-1" />
              <div>
                <div className="text-xs font-semibold text-[#A66A38]">
                  Lab 6 · MongoDB Database & CRUD Practical ({mongoGuide.database}.
                  {mongoGuide.collection})
                </div>
                <h3 className="font-display text-2xl font-semibold text-[#2D1D14]">
                  Documented MongoDB Hotel Management Commands
                </h3>
                <p className="text-xs text-[#6A5344] mt-1">{mongoGuide.note}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mongoGuide.commands.map((cmd) => (
                <div
                  key={cmd.step}
                  className="p-4 bg-[#FAF6F0] border border-[#E4D7C5] rounded-xl space-y-2"
                >
                  <div className="text-xs font-semibold text-[#2D1D14]">{cmd.step}</div>
                  <pre className="p-2.5 bg-[#2D1D14] text-[#FAF6F0] rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
                    {cmd.command}
                  </pre>
                  <p className="text-xs text-[#5A4334]">{cmd.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
