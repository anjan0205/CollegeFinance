import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  User,
  Info,
  Landmark,
  Settings,
  FileText,
  KeyRound,
  Calendar,
  UploadCloud,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  FileCheck,
  Building2,
  Paperclip,
  Check
} from 'lucide-react';
import { erpService } from '../../services/erpService';

type TabKey = 'basic' | 'bank' | 'addons' | 'locations' | 'documents';

interface LocationAddress {
  id: string;
  firstName: string;
  nickName: string;
  country: string;
  gstin: string;
  state: string;
  city: string;
  pincode: string;
  address: string;
  paymentTerms: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  bankCity: string;
  bankBranch: string;
  email: string;
  mobile: string;
}

interface DocAttachment {
  name: string;
  fileName: string | null;
  fileSize?: string;
  expiryDate: string;
  remarks: string;
}

export const AddVendorMasterPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Tab 1: Basic Info Form State
  const [vendorCode, setVendorCode] = useState(() => `VEN${Math.floor(400 + Math.random() * 500)}`);
  const [firstName, setFirstName] = useState('');
  const [vendorNickName, setVendorNickName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panNotAvailable, setPanNotAvailable] = useState(false);
  const [gstRegType, setGstRegType] = useState('Regular');
  const [gstin, setGstin] = useState('');
  const [vendorType, setVendorType] = useState('Supplier');
  const [vendorSubcategory, setVendorSubcategory] = useState('Goods & Raw Materials');

  // Tab 2: Bank, Tax and Other State
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCity, setBankCity] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [entityType, setEntityType] = useState('Private Limited');
  const [tdsSection, setTdsSection] = useState('194C - Contractor (2%)');
  const [tdsRate, setTdsRate] = useState('2.0');
  const [tdsCertNumber, setTdsCertNumber] = useState('');
  const [validityStartDate, setValidityStartDate] = useState('2026-04-01');
  const [validityEndDate, setValidityEndDate] = useState('2027-03-31');
  const [docCurrency, setDocCurrency] = useState('Rupees ( INR )');
  const [reportingCurrency, setReportingCurrency] = useState('Rupees ( INR )');
  const [countryName, setCountryName] = useState('India(IN)');
  const [state, setState] = useState('Andhra Pradesh');
  const [city, setCity] = useState('Visakhapatnam');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('30 Days Net Credit');

  // Tab 3: Add-Ons State
  const [applyLowerTds, setApplyLowerTds] = useState(false);
  const [gstDefaulted, setGstDefaulted] = useState(false);
  const [section206Verified, setSection206Verified] = useState(true);
  const [sendVendorLogin, setSendVendorLogin] = useState(false);
  const [section206Doc, setSection206Doc] = useState<string | null>(null);

  // Tab 4: Multi-Location Details State
  const [locations, setLocations] = useState<LocationAddress[]>([
    {
      id: 'LOC-1',
      firstName: '',
      nickName: '',
      country: 'India(IN)',
      gstin: '',
      state: 'Andhra Pradesh',
      city: 'Visakhapatnam',
      pincode: '',
      address: '',
      paymentTerms: '30 Days Net Credit',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      bankCity: '',
      bankBranch: '',
      email: '',
      mobile: ''
    }
  ]);

  // Tab 5: Documents & Approvals State
  const [documents, setDocuments] = useState<DocAttachment[]>([
    { name: 'Pan Doc', fileName: null, expiryDate: '', remarks: '' },
    { name: 'GST Doc', fileName: null, expiryDate: '', remarks: '' },
    { name: 'Cancel Cheque', fileName: null, expiryDate: '', remarks: '' }
  ]);
  const [approvalLevel, setApprovalLevel] = useState('Finance Controller Approval');

  // Tab Order List
  const tabsList: { key: TabKey; label: string; icon: React.ReactNode; bgClass: string; activeClass: string }[] = [
    {
      key: 'basic',
      label: 'Basic Info',
      icon: <User className="w-4 h-4" />,
      bgClass: 'bg-[#E9D5FF]/70 hover:bg-[#E9D5FF] text-purple-950',
      activeClass: 'bg-[#E9D5FF] text-purple-950 border-b-4 border-purple-700 font-extrabold shadow-sm'
    },
    {
      key: 'bank',
      label: 'Bank, Tax and Other',
      icon: <Info className="w-4 h-4" />,
      bgClass: 'bg-[#FEF08A]/70 hover:bg-[#FEF08A] text-amber-950',
      activeClass: 'bg-[#FEF08A] text-amber-950 border-b-4 border-amber-600 font-extrabold shadow-sm'
    },
    {
      key: 'addons',
      label: 'Add-Ons',
      icon: <Landmark className="w-4 h-4" />,
      bgClass: 'bg-[#7DD3FC]/70 hover:bg-[#7DD3FC] text-sky-950',
      activeClass: 'bg-[#7DD3FC] text-sky-950 border-b-4 border-sky-600 font-extrabold shadow-sm'
    },
    {
      key: 'locations',
      label: 'Multi-Location Details',
      icon: <Settings className="w-4 h-4" />,
      bgClass: 'bg-[#4ADE80]/70 hover:bg-[#4ADE80] text-emerald-950',
      activeClass: 'bg-[#4ADE80] text-emerald-950 border-b-4 border-emerald-700 font-extrabold shadow-sm'
    },
    {
      key: 'documents',
      label: 'Documents & Approvals',
      icon: <FileText className="w-4 h-4" />,
      bgClass: 'bg-[#C084FC]/70 hover:bg-[#C084FC] text-purple-950',
      activeClass: 'bg-[#C084FC] text-purple-950 border-b-4 border-purple-800 font-extrabold shadow-sm'
    }
  ];

  const handleNext = () => {
    const order: TabKey[] = ['basic', 'bank', 'addons', 'locations', 'documents'];
    const currIdx = order.indexOf(activeTab);
    if (currIdx < order.length - 1) {
      setActiveTab(order[currIdx + 1]);
    }
  };

  const handleBack = () => {
    const order: TabKey[] = ['basic', 'bank', 'addons', 'locations', 'documents'];
    const currIdx = order.indexOf(activeTab);
    if (currIdx > 0) {
      setActiveTab(order[currIdx - 1]);
    }
  };

  const handleAddLocation = () => {
    setLocations(prev => [
      ...prev,
      {
        id: `LOC-${prev.length + 1}`,
        firstName: '',
        nickName: '',
        country: 'India(IN)',
        gstin: '',
        state: 'Andhra Pradesh',
        city: 'Visakhapatnam',
        pincode: '',
        address: '',
        paymentTerms: '30 Days Net Credit',
        bankName: '',
        accountNo: '',
        ifscCode: '',
        bankCity: '',
        bankBranch: '',
        email: '',
        mobile: ''
      }
    ]);
  };

  const handleRemoveLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateLocationField = (index: number, field: keyof LocationAddress, value: string) => {
    setLocations(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleFileUpload = (docIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocuments(prev => {
        const next = [...prev];
        next[docIndex] = {
          ...next[docIndex],
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`
        };
        return next;
      });
    }
  };

  const handleSave = async (andNew: boolean = false) => {
    const payload = {
      code: vendorCode,
      name: firstName || vendorNickName || `Vendor ${vendorCode}`,
      nickName: vendorNickName,
      category: vendorSubcategory,
      vendorType,
      contactPerson: firstName,
      email,
      phone: mobile,
      gstNo: panNotAvailable ? 'UNREGISTERED' : (gstin || 'N/A'),
      panNo: panNotAvailable ? 'NOT_AVAILABLE' : panNumber,
      gstRegType,
      bankDetails: {
        accountNumber,
        ifscCode,
        bankName,
        bankCity,
        bankBranch
      },
      taxDetails: {
        entityType,
        tdsSection,
        tdsRate,
        tdsCertNumber,
        validityStartDate,
        validityEndDate,
        docCurrency,
        reportingCurrency
      },
      address: `${address}, ${city}, ${state} - ${pinCode}, ${countryName}`,
      paymentTerms,
      addOns: {
        applyLowerTds,
        gstDefaulted,
        section206Verified,
        sendVendorLogin,
        section206Doc
      },
      locations,
      documents,
      approvalLevel,
      status: 'PENDING_APPROVAL',
      rating: 5.0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    await erpService.createMasterData('vendors', payload);

    setSavedSuccess(`Vendor Master ${vendorCode} (${payload.name}) saved and sent for approval!`);

    if (andNew) {
      setTimeout(() => {
        setVendorCode(`VEN${Math.floor(400 + Math.random() * 500)}`);
        setFirstName('');
        setVendorNickName('');
        setEmail('');
        setMobile('');
        setPassword('');
        setPanNumber('');
        setGstin('');
        setSavedSuccess(null);
        setActiveTab('basic');
      }, 1200);
    } else {
      setTimeout(() => {
        navigate('/erp/master-data');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 space-y-4">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Add Vendors Master
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
            <Link to="/dashboard" className="hover:text-slate-800 flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <span>&gt;</span>
            <Link to="/erp/master-data" className="hover:text-slate-800 font-semibold text-slate-600">
              Master Data
            </Link>
            <span>&gt;</span>
            <span className="text-slate-700 font-bold">Add Vendors Master</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/erp/master-data')}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold shadow-xs transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Colorful 5 Header Navigation Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-5 text-xs font-bold border-b border-slate-200 select-none">
          {tabsList.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3.5 px-3 flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.key ? tab.activeClass : tab.bgClass
              }`}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents Container */}
        <div className="p-6 md:p-8">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Vendor Code */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Vendor Code
                  </label>
                  <input
                    type="text"
                    value={vendorCode}
                    onChange={(e) => setVendorCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    placeholder="VEN433"
                  />
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    placeholder="First Name *"
                  />
                </div>

                {/* Vendor Nick Name */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vendor Nick Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorNickName}
                    onChange={(e) => setVendorNickName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    placeholder="Vendor Nick Name *"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter email address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter email address *"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter mobile number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter mobile number *"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
                {/* Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Enter password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 pr-9 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter password"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                {/* PAN Number */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    disabled={panNotAvailable}
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500 uppercase"
                    placeholder="PAN Number"
                  />
                </div>

                {/* PAN Not Available Checkbox */}
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2.5 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl w-full">
                    <input
                      type="checkbox"
                      checked={panNotAvailable}
                      onChange={(e) => {
                        setPanNotAvailable(e.target.checked);
                        if (e.target.checked) setPanNumber('');
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-700 select-none">PAN Not Available</span>
                  </label>
                </div>

                {/* GST Reg Type */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select GST Reg Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gstRegType}
                    onChange={(e) => setGstRegType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Composition">Composition</option>
                    <option value="Unregistered">Unregistered</option>
                    <option value="Overseas">Overseas / SEZ</option>
                    <option value="Consumer">Consumer</option>
                  </select>
                </div>

                {/* GSTIN */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-500 uppercase"
                    placeholder="GSTIN"
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Select Vendor Type
                  </label>
                  <select
                    value={vendorType}
                    onChange={(e) => setVendorType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Supplier">Supplier / Trader</option>
                    <option value="Service Provider">Service Provider</option>
                    <option value="Consultant">Consultant / Professional</option>
                    <option value="Contractor">Contractor (Civil / Works)</option>
                    <option value="OEM">OEM Manufacturer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Select <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={vendorSubcategory}
                    onChange={(e) => setVendorSubcategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Goods & Raw Materials">Goods & Raw Materials</option>
                    <option value="IT Hardware & Peripherals">IT Hardware & Peripherals</option>
                    <option value="Software & Cloud Licences">Software & Cloud Licences</option>
                    <option value="Lab & Scientific Equipment">Lab & Scientific Equipment</option>
                    <option value="Classroom & Office Furniture">Classroom & Office Furniture</option>
                    <option value="Maintenance & Facility Operations">Maintenance & Facility Operations</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BANK, TAX AND OTHER */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="Account Number"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 uppercase"
                    placeholder="IFSC Code"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="Bank Name"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Bank City
                  </label>
                  <input
                    type="text"
                    value={bankCity}
                    onChange={(e) => setBankCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="Bank City"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Bank Branch
                  </label>
                  <input
                    type="text"
                    value={bankBranch}
                    onChange={(e) => setBankBranch(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="Bank Branch"
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Entity Type
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Private Limited">Private Limited</option>
                    <option value="Public Limited">Public Limited</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="LLP">LLP</option>
                    <option value="Trust / Society">Trust / Society</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    TDS Section
                  </label>
                  <select
                    value={tdsSection}
                    onChange={(e) => setTdsSection(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="194C - Contractor (2%)">194C - Contractor (2%)</option>
                    <option value="194J - Professional Services (10%)">194J - Professional Services (10%)</option>
                    <option value="194H - Brokerage (5%)">194H - Brokerage (5%)</option>
                    <option value="194I - Rent (10%)">194I - Rent (10%)</option>
                    <option value="194Q - Goods Purchase (0.1%)">194Q - Goods Purchase (0.1%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    TDS Rate
                  </label>
                  <input
                    type="text"
                    value={tdsRate}
                    onChange={(e) => setTdsRate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="TDS Rate (%)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    TDS Certificate Number
                  </label>
                  <input
                    type="text"
                    value={tdsCertNumber}
                    onChange={(e) => setTdsCertNumber(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="TDS Certificate Number"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Validity Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={validityStartDate}
                      onChange={(e) => setValidityStartDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Validity End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={validityEndDate}
                      onChange={(e) => setValidityEndDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Document Currency <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={docCurrency}
                    onChange={(e) => setDocCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Rupees ( INR )">Rupees ( INR )</option>
                    <option value="USD ( $ )">USD ( $ )</option>
                    <option value="EUR ( € )">EUR ( € )</option>
                    <option value="GBP ( £ )">GBP ( £ )</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Reporting Currency
                  </label>
                  <select
                    value={reportingCurrency}
                    onChange={(e) => setReportingCurrency(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Rupees ( INR )">Rupees ( INR )</option>
                    <option value="USD ( $ )">USD ( $ )</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Country Name
                  </label>
                  <select
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="India(IN)">India(IN)</option>
                    <option value="United States(US)">United States(US)</option>
                    <option value="United Kingdom(UK)">United Kingdom(UK)</option>
                    <option value="Singapore(SG)">Singapore(SG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                  </select>
                </div>
              </div>

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Visakhapatnam">Visakhapatnam</option>
                    <option value="Vijayawada">Vijayawada</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Guntur">Guntur</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="Address"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Pin Code
                  </label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="Pin Code"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    placeholder="Payment Terms (e.g. 30 Days Net Credit)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADD-ONS */}
          {activeTab === 'addons' && (
            <div className="space-y-6">
              {/* Checkboxes Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition">
                  <input
                    type="checkbox"
                    checked={applyLowerTds}
                    onChange={(e) => setApplyLowerTds(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">Apply Lower TDS</span>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition">
                  <input
                    type="checkbox"
                    checked={gstDefaulted}
                    onChange={(e) => setGstDefaulted(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">GST Defaulted</span>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer shadow-2xs transition">
                  <input
                    type="checkbox"
                    checked={section206Verified}
                    onChange={(e) => setSection206Verified(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-emerald-300"
                  />
                  <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Section 206AB Verified
                  </span>
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs transition">
                  <input
                    type="checkbox"
                    checked={sendVendorLogin}
                    onChange={(e) => setSendVendorLogin(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">Send Vendor Login Details</span>
                </label>
              </div>

              {/* Section 206 Document Card */}
              <div className="border border-sky-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-sky-500 text-white px-5 py-3 text-xs font-bold tracking-wide uppercase flex items-center gap-2">
                  <FileCheck className="w-4 h-4" /> Section 206 Document
                </div>
                <div className="p-6 bg-slate-50/40 flex flex-col sm:flex-row items-center gap-6">
                  {/* File Upload Button */}
                  <label className="flex flex-col items-center justify-center px-6 py-4 bg-white border-2 border-dashed border-emerald-400 rounded-xl cursor-pointer hover:bg-emerald-50/30 transition shadow-xs">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                      <UploadCloud className="w-4 h-4 text-emerald-600" /> Browse Files
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSection206Doc(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>

                  {/* Upload State / Preview */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <span className={section206Doc ? 'font-bold text-slate-800' : 'text-slate-400'}>
                        {section206Doc || 'No files uploaded yet'}
                      </span>
                    </div>
                    {section206Doc && (
                      <button
                        type="button"
                        onClick={() => setSection206Doc(null)}
                        className="text-rose-500 hover:text-rose-700 font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-LOCATION DETAILS */}
          {activeTab === 'locations' && (
            <div className="space-y-6">
              {/* Header with Plus Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="w-9 h-9 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition cursor-pointer"
                  title="Add Another Location"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Address Cards */}
              {locations.map((loc, idx) => (
                <div key={loc.id} className="border border-emerald-400 rounded-2xl overflow-hidden shadow-xs">
                  {/* Address Card Green Ribbon */}
                  <div className="bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold tracking-wider uppercase flex items-center justify-between">
                    <span>ADDRESS {idx + 1}</span>
                    {locations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(idx)}
                        className="text-emerald-100 hover:text-white flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="p-6 bg-white space-y-4">
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={loc.firstName}
                          onChange={(e) => updateLocationField(idx, 'firstName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="First Name"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Vendor Nick Name
                        </label>
                        <input
                          type="text"
                          value={loc.nickName}
                          onChange={(e) => updateLocationField(idx, 'nickName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Vendor Nick Name"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Country
                        </label>
                        <select
                          value={loc.country}
                          onChange={(e) => updateLocationField(idx, 'country', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="India(IN)">India(IN)</option>
                          <option value="United States(US)">United States(US)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          GSTIN
                        </label>
                        <input
                          type="text"
                          value={loc.gstin}
                          onChange={(e) => updateLocationField(idx, 'gstin', e.target.value.toUpperCase())}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs uppercase focus:ring-1 focus:ring-emerald-500"
                          placeholder="GSTIN"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          State <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={loc.state}
                          onChange={(e) => updateLocationField(idx, 'state', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Telangana">Telangana</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Maharashtra">Maharashtra</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          City <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={loc.city}
                          onChange={(e) => updateLocationField(idx, 'city', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Visakhapatnam">Visakhapatnam</option>
                          <option value="Vijayawada">Vijayawada</option>
                          <option value="Hyderabad">Hyderabad</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={loc.pincode}
                          onChange={(e) => updateLocationField(idx, 'pincode', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Pincode"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Address
                        </label>
                        <input
                          type="text"
                          value={loc.address}
                          onChange={(e) => updateLocationField(idx, 'address', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Address"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Payment Terms
                        </label>
                        <input
                          type="text"
                          value={loc.paymentTerms}
                          onChange={(e) => updateLocationField(idx, 'paymentTerms', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Payment Terms"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Bank Name
                        </label>
                        <input
                          type="text"
                          value={loc.bankName}
                          onChange={(e) => updateLocationField(idx, 'bankName', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Bank Name"
                        />
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Account No
                        </label>
                        <input
                          type="text"
                          value={loc.accountNo}
                          onChange={(e) => updateLocationField(idx, 'accountNo', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Account No"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          value={loc.ifscCode}
                          onChange={(e) => updateLocationField(idx, 'ifscCode', e.target.value.toUpperCase())}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs uppercase focus:ring-1 focus:ring-emerald-500"
                          placeholder="IFSC Code"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Bank city
                        </label>
                        <input
                          type="text"
                          value={loc.bankCity}
                          onChange={(e) => updateLocationField(idx, 'bankCity', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Bank city"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Bank branch
                        </label>
                        <input
                          type="text"
                          value={loc.bankBranch}
                          onChange={(e) => updateLocationField(idx, 'bankBranch', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Bank branch"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          E-Mail
                        </label>
                        <input
                          type="email"
                          value={loc.email}
                          onChange={(e) => updateLocationField(idx, 'email', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="E-Mail"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Mobile
                        </label>
                        <input
                          type="tel"
                          value={loc.mobile}
                          onChange={(e) => updateLocationField(idx, 'mobile', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500"
                          placeholder="Mobile"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: DOCUMENTS & APPROVALS */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Document Attachments Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#6D28D9] text-white font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4 w-16">S.NO.</th>
                        <th className="py-3 px-4 w-40">NAME</th>
                        <th className="py-3 px-4 w-48">ATTACHED DOCUMENTS</th>
                        <th className="py-3 px-4 w-48">ATTACHMENTS</th>
                        <th className="py-3 px-4 w-48">EXPIRY DATE</th>
                        <th className="py-3 px-4">REMARKS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {documents.map((doc, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-600">{idx + 1}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{doc.name}</td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {doc.fileName ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                <Paperclip className="w-3.5 h-3.5" /> {doc.fileName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No document attached</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold cursor-pointer shadow-2xs transition">
                              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                              <span>Upload {doc.name}</span>
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFileUpload(idx, e)}
                              />
                            </label>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="relative">
                              <input
                                type="date"
                                value={doc.expiryDate}
                                onChange={(e) => {
                                  const next = [...documents];
                                  next[idx].expiryDate = e.target.value;
                                  setDocuments(next);
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs focus:ring-1 focus:ring-purple-500"
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              value={doc.remarks}
                              onChange={(e) => {
                                const next = [...documents];
                                next[idx].remarks = e.target.value;
                                setDocuments(next);
                              }}
                              placeholder="Enter remarks..."
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs focus:ring-1 focus:ring-purple-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Approval Dropdown */}
              <div className="max-w-xs">
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Approval <span className="text-rose-500">*</span>
                </label>
                <select
                  value={approvalLevel}
                  onChange={(e) => setApprovalLevel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Finance Controller Approval">Finance Controller Approval</option>
                  <option value="Registrar & Principal Signoff">Registrar & Principal Signoff</option>
                  <option value="Direct Admin Approval">Direct Admin Approval</option>
                  <option value="Maker Submitted (Pending Checker)">Maker Submitted (Pending Checker)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Form Bottom Actions Footer Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            {activeTab !== 'basic' && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'documents' ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save and New
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVendorMasterPage;
