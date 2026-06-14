import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./App.css";

type ResultStatus = "Negative" | "Positive";

type LabRow = {
  id: string;
  labGroup: string;
  item: string;
  result: string;
  unit: string;
  reference: string;
  method: string;
  refLow?: number;
  refHigh?: number;
  inputType?: "rapid" | "numeric" | "urine";
  options?: string[];
};

type LabName =
  | "COVID-19 Antigen Test"
  | "Influenza Test"
  | "Dengue Test"
  | "Anti-HIV"
  | "HBsAg"
  | "Anti-HCV"
  | "Syphilis Test"
  | "Chlamydia Test"
  | "Gonorrhea Test"
  | "Other";

  type NumericLabName =
  | "CBC"
  | "DTX"
  | "Blood Electrolyte"
  | "Blood Chemistry"
  | "Urine Examination";

type SavedReport = {
  id: string;
  savedAt: string;
  labNo: string;
  patient: {
    name: string;
    dob: string;
    gender: string;
    nationality: string;
    hn: string;
    passportNo: string;
  };
  testInfo: {
    date: string;
    time: string;
    performedBy: string;
    note: string;
  };
  runningNo: number;
  rows: LabRow[];
  dtxResult: string;
  showDtx: boolean;
  authorizedBy: string;
  authorizedPosition: string;
  isApproved: boolean;
  approvedAt: string;
};

const DEFAULT_LAB_OPTIONS = [
  "COVID-19 Antigen Test",
  "Influenza Test",
  "Dengue Test",
  "Anti-HIV",
  "HBsAg",
  "Anti-HCV",
  "Syphilis Test",
  "Chlamydia Test",
  "Gonorrhea Test",
  "Streptococcus A Throat Swab",
  "Urine Pregnancy Test",
  "Urine Ketone Test",
  "FOB Stool Occult Blood",
  "RSV Rapid Test",
  "Parainfluenza Rapid Test (PIV)",
  "Adenovirus Rapid Test (ADV)",
  "Mycoplasma Rapid Test (MP)",
  "H. pylori Stool Antigen",
  "Rotavirus Stool Antigen",
  "Malaria Rapid Test",
  "Scrub Typhus Test",
  "Other",
];

const CBC_ITEMS = [
  { item: "White Blood Cell (WBC)", unit: "10^9/L", refLow: 4, refHigh: 10 },
  { item: "Lymphocyte % (Lym%)", unit: "%", refLow: 20, refHigh: 40 },
  { item: "Granulocyte % (GR%)", unit: "%", refLow: 50, refHigh: 75 },
  { item: "Lym#", unit: "10^9/L", refLow: 0.8, refHigh: 4.5 },
  { item: "GR#", unit: "10^9/L", refLow: 1.8, refHigh: 6.3 },
  { item: "Red Blood Cell (RBC)", unit: "10^12/L", refLow: 3.5, refHigh: 5.5 },
  { item: "Hemoglobin (Hb)", unit: "g/L", refLow: 110, refHigh: 160 },
  { item: "Hematocrit (Hct)", unit: "%", refLow: 37, refHigh: 49 },
  { item: "MCV", unit: "fL", refLow: 80, refHigh: 100 },
  { item: "MCH", unit: "pg", refLow: 27, refHigh: 34 },
  { item: "MCHC", unit: "g/L", refLow: 320, refHigh: 360 },
  { item: "RDW-CV", unit: "%", refLow: 0, refHigh: 16 },
  { item: "RDW-SD", unit: "fL", refLow: 37, refHigh: 55 },
  { item: "Platelet (PLT)", unit: "10^9/L", refLow: 100, refHigh: 300 },
];
const ELECTROLYTE_ITEMS = [
  {
    item: "tCO2",
    unit: "mmol/L",
    refLow: 22,
    refHigh: 29,
  },
  {
    item: "Ca",
    unit: "mmol/L",
    refLow: 2.00,
    refHigh: 2.58,
  },
  {
    item: "PHOS",
    unit: "mmol/L",
    refLow: 0.85,
    refHigh: 1.50,
  },
  {
    item: "Mg",
    unit: "mmol/L",
    refLow: 0.65,
    refHigh: 1.10,
  },
  {
    item: "K+",
    unit: "mmol/L",
    refLow: 3.4,
    refHigh: 5.1,
  },
  {
    item: "Na+",
    unit: "mmol/L",
    refLow: 135,
    refHigh: 145,
  },
  {
    item: "Cl-",
    unit: "mmol/L",
    refLow: 99,
    refHigh: 110,
  },
];
const BLOOD_CHEMISTRY_ITEMS = [
  { item: "Albumin (ALB)", unit: "g/dL", refLow: 3.3, refHigh: 5.5 },
  { item: "Total Protein (TP)", unit: "g/dL", refLow: 6.4, refHigh: 8.5 },
  { item: "Globulin (GLOB)", unit: "g/dL", refLow: 2.0, refHigh: 4.0 },
  { item: "A/G Ratio (A/G)", unit: "", refLow: 1.2, refHigh: 2.4 },
  { item: "Total Bilirubin (TB)", unit: "mg/dL", refLow: 0.2, refHigh: 1.2 },
  { item: "Gamma GT (GGT)", unit: "U/L", refLow: 11, refHigh: 50 },
  { item: "AST (SGOT)", unit: "U/L", refLow: 15, refHigh: 40 },
  { item: "ALT (SGPT)", unit: "U/L", refLow: 9, refHigh: 50 },
  { item: "Alkaline Phosphatase (ALP)", unit: "U/L", refLow: 40, refHigh: 150 },
  { item: "Amylase (AMY)", unit: "U/L", refLow: 20, refHigh: 110 },
  { item: "Creatinine (CRE)", unit: "mg/dL", refLow: 0.5, refHigh: 1.1 },
  { item: "Uric Acid (UA)", unit: "mg/dL", refLow: 3.49, refHigh: 7.19 },
  { item: "Blood Urea Nitrogen (BUN)", unit: "mmol/L", refLow: 2.5, refHigh: 8.2 },
  { item: "Glucose (GLU)", unit: "mg/dL", refLow: 70, refHigh: 110 },
];
const URINE_EXAM_ITEMS = [
  {
    item: "Urobilinogen",
    unit: "",
    reference: "Normal",
    options: ["Normal", "1+", "2+", "3+"],
  },
  {
    item: "Bilirubin",
    unit: "",
    reference: "Negative",
    options: ["Negative", "1+", "2+", "3+"],
  },
  {
    item: "Ketone",
    unit: "",
    reference: "Negative",
    options: ["Negative", "Trace", "1+", "2+", "3+", "4+"],
  },
  {
    item: "Creatinine",
    unit: "",
    reference: "",
    options: ["0.9", "1.8", "2.7"],
  },
  {
    item: "Blood",
    unit: "",
    reference: "Negative",
    options: ["Negative", "Trace", "1+", "2+", "3+", "4+"],
  },
  {
    item: "Protein",
    unit: "",
    reference: "Negative",
    options: ["Negative", "Trace", "1+", "2+", "3+", "4+"],
  },
  {
    item: "Microalbumin",
    unit: "",
    reference: "<10",
    options: ["10", "30", "80", "150"],
  },
  {
    item: "Nitrite",
    unit: "",
    reference: "Negative",
    options: ["Negative", "Positive"],
  },
  {
    item: "Leukocytes",
    unit: "",
    reference: "Negative",
    options: ["Negative", "Trace", "1+", "2+", "3+", "4+"],
  },
  {
    item: "Glucose",
    unit: "",
    reference: "Negative",
    options: ["Negative", "Trace", "1+", "2+", "3+", "4+"],
  },
  {
    item: "Specific Gravity",
    unit: "",
    reference: "1.000-1.030",
    options: ["1.000", "1.005", "1.010", "1.015", "1.020", "1.025", "1.030"],
  },
  {
    item: "pH",
    unit: "",
    reference: "5.0-8.5",
    options: ["5.0", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5"],
  },
  {
    item: "Ascorbic Acid",
    unit: "",
    reference: "0",
    options: ["0", "1+", "2+", "3+"],
  },
  {
    item: "Calcium",
    unit: "",
    reference: "≤1.0",
    options: ["≤1.0", "2.5", "5.0", "7.5", "10"],
  },
];

function makeCbcRows(): LabRow[] {
  return CBC_ITEMS.map((test) => ({
    id: newId(),
    labGroup: "CBC",
    item: test.item,
    result: "",
    unit: test.unit,
    reference: `${test.refLow}-${test.refHigh}`,
    method: "",
    refLow: test.refLow,
    refHigh: test.refHigh,
    inputType: "numeric",
  }));
}
function makeElectrolyteRows(): LabRow[] {
  return ELECTROLYTE_ITEMS.map((test) => ({
    id: newId(),
    labGroup: "Blood Electrolyte",
    item: test.item,
    result: "",
    unit: test.unit,
    reference: `${test.refLow}-${test.refHigh}`,
    method: "",
    refLow: test.refLow,
    refHigh: test.refHigh,
    inputType: "numeric",
  }));
}
function makeBloodChemistryRows(): LabRow[] {
  return BLOOD_CHEMISTRY_ITEMS.map((test) => ({
    id: newId(),
    labGroup: "Blood Chemistry",
    item: test.item,
    result: "",
    unit: test.unit,
    reference: `${test.refLow}-${test.refHigh}`,
    method: "",
    refLow: test.refLow,
    refHigh: test.refHigh,
    inputType: "numeric",
  }));
}
function makeUrineExamRows(): LabRow[] {
  return URINE_EXAM_ITEMS.map((test) => ({
    id: newId(),
    labGroup: "Urine Examination",
    item: test.item,
    result: "",
    unit: test.unit,
    reference: test.reference,
    method: "Dipstick",
    inputType: "urine",
    options: test.options,
  }));
}
const DEFAULT_NOTE =
  "This report is issued based on the sample tested at the date and time stated above. Clinical correlation is recommended. If symptoms persist or worsen, please consult a physician.";
const NOTE_TEMPLATES = [
  {
    label: "Default report note",
    text: DEFAULT_NOTE,
  },
  {
    label: "Hemolysis caution",
    text: "Hemolysis was observed. Please interpret affected laboratory results with caution.",
  },
  {
    label: "Lipemic sample caution",
    text: "Lipemic sample was observed. Please interpret affected laboratory results with caution.",
  },
  {
    label: "Insufficient sample",
    text: "The sample volume was insufficient for complete analysis. Repeat sample collection is recommended if clinically indicated.",
  },
  {
    label: "Clinical correlation advised",
    text: "Clinical correlation is advised. Please interpret the results together with the patient's symptoms, physical examination, and clinical history.",
  },
  {
    label: "Repeat test if symptoms persist",
    text: "If symptoms persist or worsen, repeat testing or further investigation is recommended.",
  },
];

const DEFAULT_PERFORMERS = [
  "Dr. Pichaiyut Naktongkul",
  "Nurse",
  "Medical assistant",
  "Lab technician",
  "Paramedics"
];

const DEFAULT_AUTHORIZED_PERSONS = [
  {
    name: "Dr. Pichaiyut Naktongkul",
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

function getDeviceCode() {
  const saved = localStorage.getItem("deviceCode");

  if (saved) return saved;

  const code = Math.random().toString(36).substring(2, 5).toUpperCase();

  localStorage.setItem("deviceCode", code);

  return code;
}

function generateLabNo(dateText: string, running: number, deviceCode: string) {
  return `TKC-${dateCompact(dateText)}-${deviceCode}-${String(running).padStart(3, "0")}`;
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

  if (lab === "COVID-19 Antigen Test") {
    return [
      {
        id: newId(),
        labGroup: "COVID-19 Antigen Test",
        item: "COVID-19 Antigen",
        ...base,
      },
    ];
  }

  if (lab === "Influenza Test") {
    return [
      {
        id: newId(),
        labGroup: "Influenza Test",
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

  if (lab === "Dengue Test") {
    return [
      {
        id: newId(),
        labGroup: "Dengue Test",
        item: "Dengue NS1",
        ...base,
      },
      {
        id: newId(),
        labGroup: "Dengue Test",
        item: "Dengue IgM",
        ...base,
      },
      {
        id: newId(),
        labGroup: "Dengue Test",
        item: "Dengue IgG",
        ...base,
      },
    ];
  }
  const customPresetLabs = [
  "Streptococcus A Throat Swab",
  "Urine Pregnancy Test",
  "Urine Ketone Test",
  "FOB Stool Occult Blood",
  "RSV Rapid Test",
  "Parainfluenza Rapid Test (PIV)",
  "Adenovirus Rapid Test (ADV)",
  "Mycoplasma Rapid Test (MP)",
  "H. pylori Stool Antigen",
  "Rotavirus Stool Antigen",
  "Malaria Rapid Test",
  "Scrub Typhus Test",
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
  const [deviceCode] = useState(() => getDeviceCode());
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
const [selectedNoteTemplate, setSelectedNoteTemplate] =
  useState("Default report note");

  const [runningNo, setRunningNo] = useState(1);
const [selectedLab, setSelectedLab] =
  useState<LabName>("COVID-19 Antigen Test");

const [labOptions, setLabOptions] = useState<string[]>(
  DEFAULT_LAB_OPTIONS
);

const [customLabName, setCustomLabName] = useState("");
  const [rows, setRows] = useState<LabRow[]>(
    makeRowsFromLab("COVID-19 Antigen Test")
  );
  const [selectedNumericLab, setSelectedNumericLab] =
  useState<NumericLabName>("CBC");

const [dtxResult, setDtxResult] = useState("");
const [showDtx, setShowDtx] = useState(false);
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
const [showHelp, setShowHelp] = useState(false);
const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
  const saved = localStorage.getItem("savedReports");
  return saved ? JSON.parse(saved) : [];
});
  const labNo = generateLabNo(testInfo.date, runningNo, deviceCode);
  const age = calculateAge(patient.dob, testInfo.date);

  function addSelectedLab() {
    setRows((current) => [
      ...current,
      ...makeRowsFromLab(selectedLab, customLabName),
    ]);
    setCustomLabName("");
  }
function addNumericLab() {
  if (selectedNumericLab === "CBC") {
    setRows((current) => [...current, ...makeCbcRows()]);
    return;
  }

  if (selectedNumericLab === "DTX") {
    setShowDtx(true);
    return;
  }

  if (selectedNumericLab === "Blood Electrolyte") {
    setRows((current) => [
      ...current,
      ...makeElectrolyteRows(),
    ]);
    return;
  }
  if (selectedNumericLab === "Blood Chemistry") {
  setRows((current) => [
    ...current,
    ...makeBloodChemistryRows(),
  ]);
  return;
}
if (selectedNumericLab === "Urine Examination") {
  setRows((current) => [
    ...current,
    ...makeUrineExamRows(),
  ]);
  return;
}
}

function clearNumericLab() {
  setRows((current) =>
    current.filter(
      (row) =>
        row.inputType !== "numeric" &&
        row.inputType !== "urine"
    )
  );

  setDtxResult("");
  setShowDtx(false);
}
  
  function setResult(id: string, result: ResultStatus) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, result } : row))
    );
  }
  function setNumericResult(id: string, value: string) {
  setRows((current) =>
    current.map((row) =>
      row.id === id ? { ...row, result: value } : row
    )
  );
}

function getNumericFlag(row: LabRow) {
  if (row.inputType !== "numeric") return "";

  const value = Number(row.result);

  if (!row.result.trim()) return "";
  if (Number.isNaN(value)) return "";
  if (row.refLow === undefined || row.refHigh === undefined) return "";

  if (value < row.refLow) return "L";
  if (value > row.refHigh) return "H";

  return "";
}

function displayResult(row: LabRow) {
  const flag = getNumericFlag(row);

  if (!row.result.trim()) return "-";
  if (!flag) return row.result;

  return `${row.result} (${flag})`;
}

function resultClassName(row: LabRow) {
  if (row.inputType === "urine") {
    return isUrineAbnormal(row) ? "result positive" : "";
  }

  if (row.inputType === "numeric") {
    return getNumericFlag(row) ? "result positive" : "";
  }

  if (row.result === "Positive") return "result positive";
  if (row.result === "Negative") return "result negative";

  return "";
}

function isDtxAbnormal(value: string) {
  const numberValue = Number(value);

  if (!value.trim()) return false;
  if (Number.isNaN(numberValue)) return false;

  return numberValue < 70 || numberValue > 140;
}
function isUrineAbnormal(row: LabRow) {
  if (row.inputType !== "urine") return false;
  if (!row.result.trim()) return false;

  if (row.item === "pH") {
    const value = Number(row.result);
    return value < 5.0 || value > 8.5;
  }

  if (row.item === "Specific Gravity") {
    const value = Number(row.result);
    return value < 1.0 || value > 1.03;
  }

  const normalValues = ["Negative", "Normal", "0", "≤1.0"];

  return !normalValues.includes(row.result);
}



  function removeRow(id: string) {
  setRows((current) => current.filter((row) => row.id !== id));
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

  setRows(makeRowsFromLab("COVID-19 Antigen Test"));
  setSelectedLab("COVID-19 Antigen Test");
  setCustomLabName("");
  setDtxResult("");
  setShowDtx(false);

  setIsApproved(false);
  setApprovedAt("");
  setAuthorizedBy("");
  setAuthorizedPosition("");

  refreshLabNoAndDateTime();
}

function clearLabOnly() {
  setRows([]);
  setSelectedLab("COVID-19 Antigen Test");
  setCustomLabName("");
  setDtxResult("");
  setShowDtx(false);

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

  setRows(makeRowsFromLab("COVID-19 Antigen Test"));
  setSelectedLab("COVID-19 Antigen Test");
  setCustomLabName("");
setDtxResult("");
setShowDtx(false);
  setAuthorizedBy("");
  setAuthorizedPosition("");
  setIsApproved(false);
  setApprovedAt("");
}
function saveRecord() {
  const record: SavedReport = {
    id: newId(),
    savedAt: new Date().toLocaleString(),
    labNo,
    patient,
    testInfo,
    runningNo,
    rows,
    dtxResult,
    showDtx,
    authorizedBy,
    authorizedPosition,
    isApproved,
    approvedAt,
  };

  const updated = [record, ...savedReports];

  setSavedReports(updated);
  localStorage.setItem("savedReports", JSON.stringify(updated));

  alert("Record saved successfully.");
}

function loadRecord(record: SavedReport) {
  setPatient(record.patient);
  setTestInfo(record.testInfo);
  setRunningNo(record.runningNo);
  setRows(record.rows);
  setDtxResult(record.dtxResult);
  setShowDtx(record.showDtx);
  setAuthorizedBy(record.authorizedBy);
  setAuthorizedPosition(record.authorizedPosition);
  setIsApproved(record.isApproved);
  setApprovedAt(record.approvedAt);
}

function deleteRecord(id: string) {
  const updated = savedReports.filter((record) => record.id !== id);

  setSavedReports(updated);
  localStorage.setItem("savedReports", JSON.stringify(updated));
}

function confirmBeforeExport() {
  const warnings: string[] = [];

  if (!patient.name.trim()) {
    warnings.push("- Patient name is missing.");
  }

  if (!patient.hn.trim()) {
    warnings.push("- HN is missing.");
  }

  if (!testInfo.performedBy.trim()) {
    warnings.push("- Tested by is missing.");
  }

  if (!authorizedBy.trim()) {
    warnings.push("- Authorized by is missing.");
  }

  if (!isApproved) {
    warnings.push("- Report has not been approved.");
  }

  const hasEmptyResult = rows.some((row) => !row.result.trim());

  if (hasEmptyResult) {
    warnings.push("- Some lab results are still empty.");
  }

  if (showDtx && !dtxResult.trim()) {
    warnings.push("- DTX result is missing.");
  }

  if (warnings.length === 0) return true;

  return window.confirm(
    "Please review before export:\n\n" +
      warnings.join("\n") +
      "\n\nDo you still want to continue?"
  );
}
function confirmIfEndReportNotOnFirstPage() {
  const paper = document.querySelector(".paper") as HTMLElement;
  const endReport = document.querySelector(".end-report") as HTMLElement;

  if (!paper || !endReport) return true;

  const paperTop = paper.getBoundingClientRect().top;
  const endReportBottom = endReport.getBoundingClientRect().bottom;

  const endReportPosition = endReportBottom - paperTop;

  // ความสูงประมาณ 1 หน้า A4 บน browser
  const firstPageLimit = 1122;

  if (endReportPosition <= firstPageLimit) return true;

  return window.confirm(
    "The End of Report section may appear on page 2 or later.\n\nPlease check the layout before printing.\n\nDo you still want to print?"
  );
}
async function savePdf() {
  if (!confirmBeforeExport()) return;

  const report = document.querySelector(".paper") as HTMLElement;

if (!report) return;

const watermark = report.querySelector(".watermark") as HTMLElement;

// ซ่อนลายน้ำชั่วคราว
if (watermark) {
  watermark.style.display = "none";
}

const canvas = await html2canvas(report, {
  scale: 2,
  useCORS: true,
  backgroundColor: "#ffffff",
});

// แสดงลายน้ำกลับ
if (watermark) {
  watermark.style.display = "";
}

 
const pdf = new jsPDF("p", "mm", "a4");

const pageWidth = 210;
const pageHeight = 297;
const margin = 10;

const usableWidth = pageWidth - margin * 2;
const usableHeight = pageHeight - margin * 2;

const pageCanvasHeight = Math.floor(
  (usableHeight * canvas.width) / usableWidth
);

let renderedHeight = 0;
let pageIndex = 0;

while (renderedHeight < canvas.height) {
  const sliceHeight = Math.min(
    pageCanvasHeight,
    canvas.height - renderedHeight
  );

  // ถ้าเหลือเศษน้อยมาก ไม่ต้องสร้างหน้าใหม่
  if (sliceHeight < 80) break;

  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = canvas.width;
  pageCanvas.height = sliceHeight;

  const ctx = pageCanvas.getContext("2d");
  if (!ctx) break;

  ctx.drawImage(
    canvas,
    0,
    renderedHeight,
    canvas.width,
    sliceHeight,
    0,
    0,
    canvas.width,
    sliceHeight
  );

  const pageImgData = pageCanvas.toDataURL("image/png");
  const pageImgHeight = (sliceHeight * usableWidth) / canvas.width;

  if (pageIndex > 0) {
    pdf.addPage();
  }

  pdf.addImage(
    pageImgData,
    "PNG",
    margin,
    margin,
    usableWidth,
    pageImgHeight
  );

  renderedHeight += sliceHeight;
  pageIndex += 1;
}

  const safeHN =
    patient.hn.trim().replace(/[\\/:*?"<>|]/g, "_") || "NoHN";

  const safeName =
    patient.name.trim().replace(/[\\/:*?"<>|]/g, "_") || "Unknown";

  pdf.save(
    `Lab report ${safeHN} ${labNo} ${safeName}.pdf`
  );
}
  return (
    <div className="app">
      {showHelp && (
  <div className="help-overlay">
    <div className="help-modal">
<h2>คู่มือการใช้งาน Lab Report Builder</h2>

<p>
<b>1. เริ่มต้นกรอกข้อมูลผู้ป่วย</b><br />
กรอกชื่อ-นามสกุล วันเดือนปีเกิด เพศ สัญชาติ
Passport No. และ HN ให้ครบถ้วน
</p>

<p>
<b>2. เพิ่มรายการตรวจ</b><br />
เลือก Rapid Test หรือ Numeric Lab
จากนั้นกด Add เพื่อเพิ่มรายการตรวจ
</p>

<p>
<b>3. กรอกผลตรวจ</b><br />
Rapid Test เลือก Positive หรือ Negative<br />
CBC / DTX / Blood Chemistry / Electrolyte
ให้กรอกค่าตัวเลขตามผลตรวจ
</p>

<p>
<b>4. ตรวจสอบข้อมูลก่อนออกผล</b><br />
ตรวจสอบชื่อผู้ป่วย เลข HN
รายการตรวจ และผลตรวจให้ถูกต้อง
</p>

<p>
<b>5. ระบุผู้ตรวจและผู้รับรองผล</b><br />
เลือก Tested by และ Authorized by
ก่อนพิมพ์รายงาน
</p>

<p>
<b>6. อนุมัติรายงาน</b><br />
กด Approve Report เพื่อบันทึกการรับรองผล
ก่อนพิมพ์หรือบันทึก PDF
</p>

<p>
<b>7. พิมพ์หรือบันทึก PDF</b><br />
Print Report = พิมพ์รายงาน<br />
Save PDF = บันทึกเป็นไฟล์ PDF
</p>

<p>
<b>8. ความหมายของปุ่มล้างข้อมูล</b><br />
Clear Patient Only = ล้างข้อมูลผู้ป่วยและเริ่ม Lab No. ใหม่<br />
Clear Lab Only = ล้างเฉพาะผลตรวจ แต่เก็บข้อมูลผู้ป่วยไว้<br />
Reset All = ล้างข้อมูลทั้งหมด
</p>

<p>
<b>9. บันทึกประวัติ</b><br />
Save Record = บันทึกข้อมูลไว้ในเครื่อง<br />
Load = เรียกข้อมูลเดิมกลับมาใช้งาน<br />
Delete = ลบข้อมูลที่บันทึกไว้
</p>

<p>
<b>10. หมายเหตุ</b><br />
หากผลตรวจเป็นสีแดง
แสดงว่าค่าดังกล่าวอยู่นอกช่วงอ้างอิง (Reference Range)
ควรตรวจสอบอีกครั้งก่อนออกผล
</p>

<button
  className="danger"
  onClick={() => setShowHelp(false)}
>
  ปิดคู่มือ
</button>
      
      

    </div>
  </div>
)}
      <header className="topbar no-print">
        <TakeCareLogo />
        <div className="top-title">
          <h1>Lab Report Builder</h1>
          <p>กรอกผลการตรวจทางห้องปฏิบัติการ</p>
        </div>
        <div className="export-buttons">
         <button
  className="help-btn"
  onClick={() => setShowHelp(true)}
  title="เปิดคู่มือการใช้งานภาษาไทย"
>
  Help
</button>

  <button
  className="primary"
  title="พิมพ์รายงาน ตรวจสอบข้อมูลก่อนพิมพ์ทุกครั้ง"
  onClick={() => {
  if (!confirmBeforeExport()) return;
  if (!confirmIfEndReportNotOnFirstPage()) return;
  window.print();
}}
>
  🖨 Print Report
  
</button>

<button
  className="pdf-btn"
  onClick={savePdf}
  title="บันทึกรายงานเป็นไฟล์ PDF"
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
  <button
  className="line-btn"
  onClick={() => {
    alert("Please save PDF first, then attach in LINE.");
    window.open("https://line.me/", "_blank");
  }}
>
  LINE
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
  Device Code
  <input value={deviceCode} readOnly />
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
                  title="เลือกวันเดือนปีเกิด ระบบจะคำนวณอายุให้อัตโนมัติ"
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
    title="เลือกเพศของผู้ป่วย"
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
                  title="กรอกสัญชาติของผู้ป่วย เช่น Thai, British, German"
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
                  title="กรอกหมายเลข Passport ของผู้ป่วย"
                />
              </label>
            </div>

            <label>
              HN
              <input
  value={patient.hn}
  onChange={(e) => setPatient({ ...patient, hn: e.target.value })}
  placeholder="HN-000123"
  title="กรอกเลข HN หรือเลขประจำตัวผู้ป่วยของคลินิก"
/>
            </label>
          </div>

          <div className="card">
            <h2>Select Lab Group</h2>

            <div className="row">
              <select
  value={selectedLab}
  title="เลือกชนิดการตรวจแบบ Positive / Negative แล้วกด Add"
                onChange={(e) => setSelectedLab(e.target.value as LabName)}
              >
                {labOptions.map((lab) => (
                  <option key={lab} value={lab}>
                    {lab}
                  </option>
                ))}
              </select>
              <button
  className="primary small-btn"
  onClick={addSelectedLab}
  title="เพิ่มรายการตรวจที่เลือกเข้าสู่รายงาน"
>
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
              {rows
  .filter((row) => row.inputType !== "numeric" && row.inputType !== "urine")
  .map((row) => (
                <div className="mini-row" key={row.id}>
                  <div>
                    <b>{row.labGroup}</b>
                    <br />
                    <span>{row.item}</span>
                  </div>
                  <div className="mini-actions">
  {row.inputType === "numeric" ? (
    <input
      type="number"
      value={row.result}
      onChange={(e) => setNumericResult(row.id, e.target.value)}
      placeholder="Result"
      className={getNumericFlag(row) ? "abnormal-input" : ""}
    />
  ) : (
    <>
      <button
        className={
          row.result === "Negative"
            ? "mini-neg active"
            : "mini-neg"
        }
        onClick={() => setResult(row.id, "Negative")}
        title="กดเมื่อผลตรวจเป็นลบ"
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
        title="กดเมื่อผลตรวจเป็นบวก"
      >
        Positive
      </button>
    </>
  )}

  <button
  className="delete"
  onClick={() => removeRow(row.id)}
  title="ลบรายการตรวจนี้ออกจากรายงาน"
>
  ×
</button>
</div>

                </div>
              ))}
            </div>
            <button
  type="button"
  className="danger small-btn"
  onClick={() =>
  setRows((current) =>
    current.filter((row) => row.inputType === "numeric")
  )
}

>
  Clear Rapid Test
</button>

        
          </div>
<div className="card">
  <h2>Numeric Lab</h2>

  <div className="row">
    <select
      value={selectedNumericLab}
      title="เลือกกลุ่ม Lab ที่ต้องกรอกเป็นตัวเลข"
      onChange={(e) =>
        setSelectedNumericLab(e.target.value as NumericLabName)
      }
    >
      <option value="CBC">CBC</option>
      <option value="DTX">DTX</option>
      <option value="Blood Electrolyte">
  Blood Electrolyte
</option>
<option value="Blood Chemistry">
  Blood Chemistry
</option>

<option value="Urine Examination">
  Urine Examination
</option>
    </select>

    <button
      type="button"
      className="primary small-btn"
      onClick={addNumericLab}
      title="เพิ่มกลุ่ม Lab ตัวเลขเข้าไปในรายงาน"
    >
      Add
    </button>
  </div>

  <div className="mini-table">
    {rows
      .filter((row) => row.inputType === "numeric" || row.inputType === "urine")
      .map((row) => (
        <div className="mini-row" key={row.id}>
          <div>
            <b>{row.labGroup}</b>
            <br />
            <span>{row.item}</span>
          </div>

          <div className="mini-actions">
            {row.inputType === "urine" ? (
  <select
  value={row.result}
  onChange={(e) => setNumericResult(row.id, e.target.value)}
  className={isUrineAbnormal(row) ? "abnormal-input" : ""}
>
    <option value="">-- Select --</option>
    {row.options?.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
) : (
  <input
    type="number"
    value={row.result}
    onChange={(e) => setNumericResult(row.id, e.target.value)}
    placeholder="Result"
    title="กรอกค่าผลตรวจเป็นตัวเลข ระบบจะแสดงสีแดงหากอยู่นอกช่วงอ้างอิง"
    className={getNumericFlag(row) ? "abnormal-input" : ""}
  />
)}

            <button
              className="delete"
              onClick={() => removeRow(row.id)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
  </div>

  {showDtx && (
    <>
      <hr className="section-divider" />

      <label>
        Capillary blood glucose
        <input
          type="number"
          value={dtxResult}
          onChange={(e) => setDtxResult(e.target.value)}
          placeholder="Enter DTX result"
          title="กรอกค่า DTX เป็นตัวเลข หน่วย mg/dL"
          className={isDtxAbnormal(dtxResult) ? "abnormal-input" : ""}
        />
      </label>

      <p className="small-note">
        DTX Reference: 70-140 mg/dL
      </p>
    </>
  )}

  <button
  type="button"
  className="danger small-btn"
  onClick={clearNumericLab}
  title="ล้างเฉพาะ Lab ที่เป็นตัวเลข เช่น CBC, DTX, Blood Chemistry, Urine"
>
  Clear Numeric Lab
</button>
</div>

<div className="card">
  <h2>Test Information</h2>

  <div className="grid-2">
    <label>
      Date of Test
      <input
        type="date"
        value={testInfo.date}
        title="วันที่ตรวจ ใช้แสดงในรายงาน"
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
        title="เวลาที่ตรวจ ใช้แสดงในรายงาน"
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
      title="เลือกชื่อผู้ตรวจหรือผู้ทำการตรวจ"
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
      title="พิมพ์ชื่อผู้ตรวจใหม่ หากไม่มีในรายการ"
    />
    <button className="green small-btn" onClick={addPerformer}>
      Add
    </button>
  </div>

  <hr className="section-divider" />
  <label>
  Additional note template
  <select
    value={selectedNoteTemplate}
    title="เลือกข้อความหมายเหตุสำเร็จรูป"
    onChange={(e) => {
      const selectedLabel = e.target.value;
      const selectedTemplate = NOTE_TEMPLATES.find(
        (template) => template.label === selectedLabel
      );

      setSelectedNoteTemplate(selectedLabel);

      if (selectedTemplate) {
        setTestInfo({
          ...testInfo,
          note: selectedTemplate.text,
        });
      }
    }}
  >
    {NOTE_TEMPLATES.map((template) => (
      <option key={template.label} value={template.label}>
        {template.label}
      </option>
    ))}
  </select>
</label>
  <label>
  Additional note
  <textarea
    rows={5}
    value={testInfo.note}
    onChange={(e) =>
      setTestInfo({
        ...testInfo,
        note: e.target.value,
      })
    }
    placeholder="Example: Hemolysis noted. Please interpret potassium result with caution."
    title="พิมพ์หมายเหตุเพิ่มเติม เช่น ตัวอย่างเลือด hemolysis หรือคำแนะนำการแปลผล"
  />
</label>
  <label>
    Authorized by
    <select
      value={authorizedBy}
      title="เลือกผู้รับรองผลตรวจ"
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
    <input
  value={authorizedPosition}
  readOnly
  title="ตำแหน่งของผู้รับรองผล ระบบจะแสดงอัตโนมัติ"
/>
  </label>

  <div className="row">
  <input
    value={newAuthorizedName}
    onChange={(e) => setNewAuthorizedName(e.target.value)}
    placeholder="Add authorized name"
    title="เพิ่มชื่อผู้รับรองผล หากไม่มีในรายการ"
  />

  <input
    value={newAuthorizedPosition}
    onChange={(e) => setNewAuthorizedPosition(e.target.value)}
    placeholder="Position"
    title="กรอกตำแหน่งของผู้รับรองผล เช่น Physician, Nurse"
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
  title="กดเพื่อรับรองผลตรวจก่อนพิมพ์หรือบันทึก PDF"
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
            <div className="card">
  <h2>Saved History</h2>

  {savedReports.length === 0 ? (
    <p className="small-note">No saved records.</p>
  ) : (
    <div className="mini-table">
      {savedReports.map((record) => (
        <div className="mini-row" key={record.id}>
          <div>
            <b>{record.patient.name || "Unknown Patient"}</b>
            <br />
            <span>{record.labNo}</span>
            <br />
            <span>{record.savedAt}</span>
          </div>

          <div className="mini-actions">
            <button
  className="primary small-btn"
  onClick={() => loadRecord(record)}
  title="ดึงข้อมูลรายงานนี้กลับมาแก้ไขหรือพิมพ์ใหม่"
>
  Load
</button>

            <button
  className="delete"
  onClick={() => deleteRecord(record.id)}
  title="ลบประวัติรายงานนี้ออกจากเครื่อง"
>
  ×
</button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
  <button
  className="primary"
  onClick={clearPatientOnly}
  title="ล้างข้อมูลผู้ป่วยและผลตรวจ พร้อมสร้าง Lab No. ใหม่"
>
    Clear Patient Only
  </button>

  <button
  className="warning"
  onClick={clearLabOnly}
  title="ล้างเฉพาะผลตรวจ แต่เก็บข้อมูลผู้ป่วยไว้"
>
    Clear Lab Only
  </button>

<button
  className="green"
  onClick={saveRecord}
  title="บันทึกข้อมูลรายงานนี้ไว้ในเครื่อง"
>
  Save Record
</button>

  <button className="danger" onClick={resetAll}>
    Reset All
  </button>
</div>
        </section>
   
        
        <section className="report-scroll">
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
                  <td className={resultClassName(row)}>
  {displayResult(row)}
</td>

                  <td>{row.unit}</td>
                  <td>{row.reference}</td>
                  <td>{row.method}</td>
                </tr>
              ))}
              {showDtx && (
  <tr>
    <td>DTX</td>
    <td>Capillary blood glucose</td>
    <td className={isDtxAbnormal(dtxResult) ? "result positive" : ""}>
      {dtxResult || "-"}
    </td>
    <td>mg/dL</td>
    <td>70-140</td>
    <td></td>
  </tr>
)}
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
  <div className="note">
  <b>Laboratory Note</b>
  <br />
  <br />
  {testInfo.note}
</div>
</div>

          <div className="end-report">*** End of Report ***</div>
        </section>
      </section>
    </main>
  </div>
);
}

