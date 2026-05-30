import { useMemo, useState } from "react";
import "./App.css";

type ResultStatus = "Negative" | "Positive";

type LabRow = {
  id: string;
  labGroup: string;
  item: string;
  result: ResultStatus;
  unit: string;
  reference: string;
  method: string;
};

type LabName =
  | "COVID-19 antigen test"
  | "Influenza test"
  | "Dengue test"
  | "Anti-HIV"
  | "HBsAg"
  | "Anti-HCV"
  | "Syphilis test"
  | "Chlamydia test"
  | "Gonorrhea test"
  | "Other";



const DEFAULT_LAB_OPTIONS = [
  "COVID-19 antigen test",
  "Influenza test",
  "Dengue test",
  "Anti-HIV",
  "HBsAg",
  "Anti-HCV",
  "Syphilis test",
  "Chlamydia test",
  "Gonorrhea test",
  "Streptococcus A throat swab",
  "Urine pregnancy test",
  "Urine ketone test",
  "FOB stool occult blood",
  "RSV rapid test",
  "Parainfluenza rapid test (PIV)",
  "Adenovirus rapid test (ADV)",
  "Mycoplasma rapid test (MP)",
  "H. pylori stool antigen",
  "Rotavirus stool antigen",
  "Malaria rapid test",
  "Scrub typhus test",
  "Other",
];


const DEFAULT_NOTE =
  "This report is issued based on the sample tested at the date and time stated above. Clinical correlation is recommended. If symptoms persist or worsen, please consult a physician.";

const DEFAULT_PERFORMERS = [
  "Dr. Pichaiyut Naktongkul",
  "Nurse",
  "Medical assistant",
  "Lab technician",
  "Paramidics"
];

const DEFAULT_AUTHORIZED_PERSONS = [
  {
    name: "Dr. Pichaiyut Nakthongkul",
    position: "Physician",
  },
  {
    name: "Dr. Ponlawat Pitsuwan",
    position: "Physician",
  },
  {
    name: "Nurse",
    position: "Nurse",
  },
];

function newId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timeInput(date: Date) {
  return date.toTimeString().slice(0, 5);
}

function dateCompact(dateText: string) {
  const date = dateText ? new Date(`${dateText}T00:00:00`) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function generateLabNo(dateText: string, running: number) {
  return `TKC-${dateCompact(dateText)}-${String(running).padStart(3, "0")}`;
}

function calculateAge(dob: string, refDateText: string) {
  if (!dob) return "-";
  const birth = new Date(`${dob}T00:00:00`);
  const ref = refDateText ? new Date(`${refDateText}T00:00:00`) : new Date();

  if (Number.isNaN(birth.getTime()) || birth > ref) return "-";

  let years = ref.getFullYear() - birth.getFullYear();
  let months = ref.getMonth() - birth.getMonth();
  const days = ref.getDate() - birth.getDate();

  if (days < 0) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0) return `${years} Years`;
  if (months > 0) return `${months} Months`;

  const diff = ref.getTime() - birth.getTime();
  return `${Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))} Days`;
}

function makeRowsFromLab(lab: LabName, customLabName = ""): LabRow[] {
  const base = {
    result: "Negative" as ResultStatus,
    unit: "-",
    reference: "Negative",
    method: "Rapid Test",
  };

  if (lab === "COVID-19 antigen test") {
    return [
      {
        id: newId(),
        labGroup: "COVID-19 antigen test",
        item: "COVID-19 Antigen",
        ...base,
      },
    ];
  }

  if (lab === "Influenza test") {
    return [
      {
        id: newId(),
        labGroup: "Influenza test",
        item: "Influenza A",
        ...base,
      },
      {
        id: newId(),
        labGroup: "Influenza test",
        item: "Influenza B",
        ...base,
      },
    ];
  }

  if (lab === "Dengue test") {
    return [
      {
        id: newId(),
        labGroup: "Dengue test",
        item: "Dengue NS1",
        ...base,
      },
      {
        id: newId(),
        labGroup: "Dengue test",
        item: "Dengue IgM",
        ...base,
      },
      {
        id: newId(),
        labGroup: "Dengue test",
        item: "Dengue IgG",
        ...base,
      },
    ];
  }
  const customPresetLabs = [
    "Streptococcus A throat swab",
    "Urine pregnancy test",
    "Urine ketone test",
    "FOB stool occult blood",
    "RSV rapid test",
    "Parainfluenza rapid test (PIV)",
    "Adenovirus rapid test (ADV)",
    "Mycoplasma rapid test (MP)",
    "H. pylori stool antigen",
    "Rotavirus stool antigen",
    "Malaria rapid test",
    "Scrub typhus test",
  ];

  if (customPresetLabs.includes(lab)) {
    return [
      {
        id: newId(),
        labGroup: lab,
        item: lab,
        ...base,
      },
    ];
  }

  if (lab === "Other") {
    const name = customLabName.trim() || "Other rapid test";
    return [
      {
        id: newId(),
        labGroup: name,
        item: name,
        ...base,
      },
    ];
  }

  return [
    {
      id: newId(),
      labGroup: lab,
      item: lab,
      ...base,
    },
  ];
}


function TakeCareLogo() {
  return (
    <div className="logo-wrap">
      <img
        src="/takecare-logo.jpg"
        alt="Takecare Clinic"
        className="real-logo"
      />
    </div>
  );
}

function TakeCareStamp() {
  return (
    <img
      src="/takecare-stamp.jpg"
      alt="Clinic Stamp"
      className="real-stamp"
    />
  );
}

export default function App() {

  const now = useMemo(() => new Date(), []);
  const [patient, setPatient] = useState({
  name: "",
  dob: "",
  gender: "",
  nationality: "",
  hn: "",
  passportNo: "",
});

  const [testInfo, setTestInfo] = useState({
    date: todayInput(now),
    time: timeInput(now),
    performedBy: "",
    note: DEFAULT_NOTE,
  });

  const [runningNo, setRunningNo] = useState(1);
const [selectedLab, setSelectedLab] =
  useState<LabName>("COVID-19 antigen test");

const [labOptions, setLabOptions] = useState<string[]>(() => {
  const saved = localStorage.getItem("customLabs");
  const customLabs = saved ? JSON.parse(saved) : [];
  return [...DEFAULT_LAB_OPTIONS.slice(0, -1), ...customLabs, "Other"];
});

const [customLabName, setCustomLabName] = useState("");
  const [rows, setRows] = useState<LabRow[]>(
    makeRowsFromLab("COVID-19 antigen test")
  );
  const [performers, setPerformers] = useState(DEFAULT_PERFORMERS);
  const [newPerformer, setNewPerformer] = useState("");
  const [authorizedBy, setAuthorizedBy] = useState("");
const [authorizedPosition, setAuthorizedPosition] = useState("");
const [isApproved, setIsApproved] = useState(false);
const [approvedAt, setApprovedAt] = useState("");
const [authorizedPersons, setAuthorizedPersons] = useState(
  DEFAULT_AUTHORIZED_PERSONS
);
const [newAuthorizedName, setNewAuthorizedName] = useState("");
const [newAuthorizedPosition, setNewAuthorizedPosition] = useState("");

  const labNo = generateLabNo(testInfo.date, runningNo);
  const age = calculateAge(patient.dob, testInfo.date);

  function addSelectedLab() {
    setRows((current) => [
      ...current,
      ...makeRowsFromLab(selectedLab, customLabName),
    ]);
    setCustomLabName("");
  }

  
  function setResult(id: string, result: ResultStatus) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, result } : row))
    );
  }

  function removeRow(id: string) {
    setRows((current) =>
      current.length === 1 ? current : current.filter((row) => row.id !== id)
    );
  }

  function addPerformer() {
    const name = newPerformer.trim();
    if (!name) return;

    if (!performers.includes(name)) {
      setPerformers((current) => [...current, name]);
    }

    setTestInfo((current) => ({ ...current, performedBy: name }));
    setNewPerformer("");
  }

function refreshLabNoAndDateTime() {
  const fresh = new Date();

  setTestInfo((current) => ({
    ...current,
    date: todayInput(fresh),
    time: timeInput(fresh),
  }));

  setRunningNo((current) => current + 1);
}

  function clearPatientOnly() {
  setPatient({
  name: "",
  dob: "",
  gender: "",
  nationality: "",
  hn: "",
  passportNo: "",
});

  setRows(makeRowsFromLab("COVID-19 antigen test"));
  setSelectedLab("COVID-19 antigen test");
  setCustomLabName("");

  setIsApproved(false);
  setApprovedAt("");
  setAuthorizedBy("");
  setAuthorizedPosition("");

  refreshLabNoAndDateTime();
}

  function resetAll() {
  const fresh = new Date();

  setPatient({
  name: "",
  dob: "",
  gender: "",
  nationality: "",
  hn: "",
  passportNo: "",
});

  setTestInfo({
    date: todayInput(fresh),
    time: timeInput(fresh),
    performedBy: "",
    note: DEFAULT_NOTE,
  });

  setRunningNo((current) => current + 1);

  setRows(makeRowsFromLab("COVID-19 antigen test"));
  setSelectedLab("COVID-19 antigen test");
  setCustomLabName("");

  setAuthorizedBy("");
  setAuthorizedPosition("");
  setIsApproved(false);
  setApprovedAt("");
}

  return (
    <div className="app">
      <header className="topbar no-print">
        <TakeCareLogo />
        <div className="top-title">
          <h1>Lab Report Builder</h1>
          <p>กรอกผลการตรวจทางห้องปฏิบัติการ</p>
        </div>
        <div className="export-buttons">
  <button className="primary" onClick={() => window.print()}>
    🖨 Print Report
  </button>

<button
  className="pdf-btn"
  onClick={() => {
    setTimeout(() => {
      window.print();
    }, 100);
  }}
>
  📄 Save PDF
</button>

  <button
    className="whatsapp-btn"
    onClick={() => {
      alert("Please save PDF first, then attach in WhatsApp.");
      window.open("https://wa.me/", "_blank");
    }}
  >
    WhatsApp
  </button>
</div>
      </header>

      <main className="workspace">
        <section className="controls no-print">
          <div className="card">
            <h2>Lab Information</h2>
            <label>
              Lab No.
              <input value={labNo} readOnly />
            </label>
            <label>
              Running No.
              <input
                type="number"
                min={1}
                value={runningNo}
                onChange={(e) => setRunningNo(Number(e.target.value) || 1)}
              />
            </label>
          </div>

          <div className="card">
            <h2>Patient Information</h2>

            <label>
              Name - Surname
              <input
                value={patient.name}
                onChange={(e) =>
                  setPatient({ ...patient, name: e.target.value })
                }
                placeholder="John Smith"
              />
            </label>

            <div className="grid-2">
              <label>
                Date of Birth
                <input
                  type="date"
                  value={patient.dob}
                  onChange={(e) =>
                    setPatient({ ...patient, dob: e.target.value })
                  }
                />
              </label>
              <label>
                Age
                <input value={age} readOnly />
              </label>
            </div>
<div className="grid-2">
  <label>
    Gender
    <select
      value={patient.gender}
      onChange={(e) =>
        setPatient({
          ...patient,
          gender: e.target.value,
        })
      }
    >
      <option value="">-- Select Gender --</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Other">Other</option>
    </select>
  </label>
</div>

            <div className="grid-2">
              <label>
                Nationality
                <input
                  value={patient.nationality}
                  onChange={(e) =>
                    setPatient({ ...patient, nationality: e.target.value })
                  }
                  placeholder="British"
                />
              </label>
              <label>
                Passport No.
                <input
                  value={patient.passportNo}
                  onChange={(e) =>
                    setPatient({ ...patient, passportNo: e.target.value })
                  }
                  placeholder="AB1234567"
                />
              </label>
            </div>

            <label>
              HN
              <input
                value={patient.hn}
                onChange={(e) => setPatient({ ...patient, hn: e.target.value })}
                placeholder="HN-000123"
              />
            </label>
          </div>

          <div className="card">
            <h2>Select Lab Group</h2>

            <div className="row">
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value as LabName)}
              >
                {labOptions.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
              </select>
              <button className="primary small-btn" onClick={addSelectedLab}>
                Add
              </button>
            </div>

            {selectedLab === "Other" && (
              <label>
                Custom lab name
                <button
  type="button"
  onClick={() => {
    if (!customLabName.trim()) return;

    const newLab = customLabName.trim();

    if (labOptions.includes(newLab)) {
      alert("Lab already exists");
      return;
    }

    const updatedLabs = [
      ...labOptions.filter((l) => l !== "Other"),
      newLab,
      "Other",
    ];

    setLabOptions(updatedLabs);

    localStorage.setItem(
      "customLabs",
      JSON.stringify(updatedLabs.filter((l) =>
        ![
          "COVID-19 antigen test",
          "Influenza test",
          "Dengue test",
          "Anti-HIV",
          "HBsAg",
          "Anti-HCV",
          "Syphilis test",
          "Chlamydia test",
          "Gonorrhea test",
          "Other",
        ].includes(l)
      ))
    );

    alert("New lab saved!");
  }}
>
  Save as New Lab
</button>
                <input
                  value={customLabName}
                  onChange={(e) => setCustomLabName(e.target.value)}
                  placeholder="Enter lab name"
                />
              </label>
            )}

            <div className="mini-table">
              {rows.map((row) => (
                <div className="mini-row" key={row.id}>
                  <div>
                    <b>{row.labGroup}</b>
                    <br />
                    <span>{row.item}</span>
                  </div>
                  <div className="mini-actions">
                    <button
                      className={
                        row.result === "Negative"
                          ? "mini-neg active"
                          : "mini-neg"
                      }
                      onClick={() => setResult(row.id, "Negative")}
                    >
                      Negative
                    </button>
                    <button
                      className={
                        row.result === "Positive"
                          ? "mini-pos active"
                          : "mini-pos"
                      }
                      onClick={() => setResult(row.id, "Positive")}
                    >
                      Positive
                    </button>
                    <button className="delete" onClick={() => removeRow(row.id)}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

<div className="card">
  <h2>Test Information</h2>

  <div className="grid-2">
    <label>
      Date of Test
      <input
        type="date"
        value={testInfo.date}
        onChange={(e) =>
          setTestInfo({
            ...testInfo,
            date: e.target.value,
          })
        }
      />
    </label>

    <label>
      Time of Test
      <input
        type="time"
        value={testInfo.time}
        onChange={(e) =>
          setTestInfo({
            ...testInfo,
            time: e.target.value,
          })
        }
      />
    </label>
  </div>

  <label>
    Tested by
    <select
      value={testInfo.performedBy}
      onChange={(e) =>
        setTestInfo({
          ...testInfo,
          performedBy: e.target.value,
        })
      }
    >
      <option value="">-- Select tester --</option>
      {performers.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  </label>

  <div className="row">
    <input
      value={newPerformer}
      onChange={(e) => setNewPerformer(e.target.value)}
      placeholder="Add new tester"
    />
    <button className="green small-btn" onClick={addPerformer}>
      Add
    </button>
  </div>

  <hr className="section-divider" />

  <label>
    Authorized by
    <select
      value={authorizedBy}
      onChange={(e) => {
        const selectedName = e.target.value;
        const selected = authorizedPersons.find(
          (person) => person.name === selectedName
        );

        setAuthorizedBy(selectedName);
        setAuthorizedPosition(selected?.position || "");
        setIsApproved(false);
        setApprovedAt("");
      }}
    >
      <option value="">-- Select authorized person --</option>
      {authorizedPersons.map((person) => (
        <option key={person.name} value={person.name}>
          {person.name}
        </option>
      ))}
    </select>
  </label>

  <label>
    Position
    <input value={authorizedPosition} readOnly />
  </label>
  <div className="row">
  <input
    value={newAuthorizedName}
    onChange={(e) => setNewAuthorizedName(e.target.value)}
    placeholder="Add authorized name"
  />

  <input
    value={newAuthorizedPosition}
    onChange={(e) => setNewAuthorizedPosition(e.target.value)}
    placeholder="Position"
  />

  <button
    type="button"
    className="green small-btn"
    onClick={() => {
      if (!newAuthorizedName.trim()) return;

      const newPerson = {
        name: newAuthorizedName.trim(),
        position: newAuthorizedPosition.trim() || "Medical Staff",
      };

      setAuthorizedPersons((current) => [...current, newPerson]);
      setAuthorizedBy(newPerson.name);
      setAuthorizedPosition(newPerson.position);

      setNewAuthorizedName("");
      setNewAuthorizedPosition("");
      setIsApproved(false);
      setApprovedAt("");
    }}
  >
    Add
  </button>
</div>

  <button
    type="button"
    className={isApproved ? "approved-btn active" : "approved-btn"}
    onClick={() => {
      if (!authorizedBy.trim()) {
        alert("Please select Authorized by first.");
        return;
      }

      setIsApproved(true);
      setApprovedAt(new Date().toLocaleString());
    }}
  >
    {isApproved ? "Digitally Approved" : "Approve Report"}
  </button>
</div>

          <div className="button-row">
            <button className="primary" onClick={clearPatientOnly}>
              Clear Patient Only
            </button>
            <button className="danger" onClick={resetAll}>
              Reset All
            </button>
          </div>
        </section>

        <section className="paper">
          <div className="watermark">
            <TakeCareStamp />
          </div>

          <div className="paper-header">
            <TakeCareLogo />
            <div className="clinic-info">
              <b>Takecare Medical Clinic Koh Phangan</b>
              <span>156/1 Moo 6 Bantai</span>
              <span>Koh Phangan Suratthani 84280</span>
              <span>Tel 0805757779</span>
            </div>
          </div>

          <div className="line" />

          <h1 className="report-title">LABORATORY REPORT</h1>

          <div className="patient-block">
            <div>
              <p>
                <b>Lab No.</b> : {labNo}
              </p>
              <p>
                <b>Patient Name</b> : {patient.name || "-"}
              </p>
              <p>
                <b>Date of Birth</b> : {patient.dob || "-"}
              </p>
              <p>
                <b>Age</b> : {age}
              </p>
              <p>
  <b>Gender</b> : {patient.gender || "-"}
</p>
              <p>
                <b>Nationality</b> : {patient.nationality || "-"}
              </p>
            </div>
            <div>
              <p>
                <b>Passport No.</b> : {patient.passportNo || "-"}
              </p>
              <p>
                <b>HN</b> : {patient.hn || "-"}
              </p>
            </div>
          </div>

          <table className="result-table">
            <thead>
              <tr>
                <th>Lab Group</th>
                <th>Item</th>
                <th>Result</th>
                <th>Unit</th>
                <th>Reference</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.labGroup}</td>
                  <td>{row.item}</td>
                  <td
                    className={
                      row.result === "Positive"
                        ? "result positive"
                        : "result negative"
                    }
                  >
                    {row.result}
                  </td>
                  <td>{row.unit}</td>
                  <td>{row.reference}</td>
                  <td>{row.method}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer-grid">
            <div>
              <p>
                <b>Date of Test</b> : {testInfo.date || "-"}
              </p>
              <p>
                <b>Time of Test</b> : {testInfo.time || "-"}
              </p>
              <p>
                <b>Tested by</b> : {testInfo.performedBy || "-"}
              </p>
            </div>
            <div className="signature">
  <b>Authorized Signature</b>

  {isApproved ? (
    <div className="approval-box">
      <div className="approved-label">Digitally Approved</div>
      <p>
        <b>Name:</b> {authorizedBy || "-"}
      </p>
      <p>
        <b>Position:</b> {authorizedPosition || "-"}
      </p>
      <p className="approved-time">
        Approved at: {approvedAt || "-"}
      </p>
    </div>
  ) : (
    <div className="approval-box muted">
      <p>
        <b>Name:</b> {authorizedBy || "-"}
      </p>
      <p>
        <b>Position:</b> {authorizedPosition || "-"}
      </p>
      <p className="approved-time">Status: Pending approval</p>
    </div>
  )}
</div>
          </div>

          <div className="bottom">
            <p className="note">{testInfo.note}</p>
            <div className="qr-box">
              <b>QR / Clinic Stamp</b>
              <TakeCareStamp />
            </div>
          </div>

          <div className="end-report">*** End of Report ***</div>
        </section>
      </main>
    </div>
  );
}