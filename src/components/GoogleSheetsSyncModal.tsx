import React, { useState } from 'react';
import { Student, Teacher, SchoolSettings, GoogleSheetsSyncConfig } from '../types';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { SCHOOL_CLASSES } from '../data/mockData';
import { 
  X, 
  Sheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  CloudUpload, 
  CloudDownload, 
  FileSpreadsheet, 
  Link2,
  Sparkles,
  Download
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { googleSignIn } from '../services/firebaseAuth';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  teachers: Teacher[];
  settings: SchoolSettings;
  sheetsConfig: GoogleSheetsSyncConfig;
  setSheetsConfig: React.Dispatch<React.SetStateAction<GoogleSheetsSyncConfig>>;
  firebaseUser: FirebaseUser | null;
  accessToken: string | null;
  addLog: (action: string, details: string) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  students,
  teachers,
  settings,
  sheetsConfig,
  setSheetsConfig,
  firebaseUser,
  accessToken,
  addLog,
}) => {
  const [manualIdInput, setManualIdInput] = useState(sheetsConfig.spreadsheetId || '');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);
  const [activeSyncMethod, setActiveSyncMethod] = useState<'oauth' | 'webhook' | 'direct_file'>('oauth');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    try {
      setIsProcessing(true);
      setErrorDetails(null);
      await googleSignIn();
    } catch (err: unknown) {
      setErrorDetails(err instanceof Error ? err.message : 'Google authentication failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Instant export for Google Sheets
  const handleExportGoogleSheetsFile = () => {
    try {
      setIsProcessing(true);
      GoogleSheetsService.generateGoogleSheetsWorkbook(students, teachers, settings);
      setStatusMessage('Master Google Sheets workbook (.xlsx) successfully generated! Open or drag into Google Drive.');
      addLog('Google Sheets Export', `Exported full master broadsheet workbook for Google Sheets`);
    } catch (err: any) {
      setErrorDetails(err.message || 'Failed to generate workbook');
    } finally {
      setIsProcessing(false);
    }
  };

  // Webhook sync handler
  const handleWebhookSync = async () => {
    if (!webhookUrlInput.trim()) {
      setErrorDetails('Please paste your Google Apps Script Web App URL first.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorDetails(null);
      setStatusMessage('Transmitting school results to Google Sheets Webhook...');

      const res = await GoogleSheetsService.syncViaWebhook(
        webhookUrlInput.trim(),
        students,
        teachers,
        settings
      );

      if (res.success) {
        setSheetsConfig(prev => ({
          ...prev,
          lastSyncedAt: new Date().toLocaleTimeString(),
          status: 'success',
        }));
        setStatusMessage(res.message);
        addLog('Google Sheets Webhook Sync', `Transmitted ${students.length} student scores to webhook`);
      } else {
        setErrorDetails(res.message);
      }
    } catch (err: any) {
      setErrorDetails(err.message || 'Webhook transmission failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLinkExistingSheet = () => {
    const raw = manualIdInput.trim();
    if (!raw) {
      setErrorDetails('Please enter a Google Sheet URL or ID.');
      return;
    }
    const extractedId = GoogleSheetsService.extractSpreadsheetId(raw);
    if (!extractedId) {
      setErrorDetails('Could not extract a valid Google Spreadsheet ID.');
      return;
    }

    setSheetsConfig(prev => ({
      ...prev,
      spreadsheetId: extractedId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${extractedId}/edit`,
      status: 'idle',
    }));
    setStatusMessage(`Linked to Google Spreadsheet: ${extractedId}`);
    setErrorDetails(null);
  };

  const handleCreateNewSheet = async () => {
    if (!accessToken) {
      setErrorDetails('Please connect your Google Account first to create a spreadsheet.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorDetails(null);
      setStatusMessage('Creating Master Broadsheet on Google Drive with all class tabs...');

      const result = await GoogleSheetsService.createMasterSpreadsheet(
        accessToken,
        settings,
        [...SCHOOL_CLASSES]
      );

      setSheetsConfig(prev => ({
        ...prev,
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        status: 'idle',
      }));

      setStatusMessage('Spreadsheet created! Now synchronizing 200 student records...');

      // Immediately sync all data to the newly created sheet
      const syncRes = await GoogleSheetsService.syncAllToSpreadsheet(
        accessToken,
        result.spreadsheetId,
        students,
        teachers,
        settings
      );

      if (syncRes.success) {
        setSheetsConfig(prev => ({
          ...prev,
          lastSyncedAt: new Date().toLocaleTimeString(),
          status: 'success',
        }));
        setStatusMessage(`Successfully created and synchronized 200 student results across 6 classes to Google Sheets!`);
        addLog('Google Sheets Created & Synced', `Created Master Spreadsheet (${result.spreadsheetId})`);
      } else {
        setErrorDetails(syncRes.message);
      }
    } catch (err: unknown) {
      setErrorDetails(err instanceof Error ? err.message : 'Failed to create Google Spreadsheet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncToSheets = async () => {
    if (!accessToken) {
      setErrorDetails('Please connect your Google Account first.');
      return;
    }

    const targetId = sheetsConfig.spreadsheetId || manualIdInput.trim();
    if (!targetId) {
      setErrorDetails('No Google Spreadsheet linked. Please create a new sheet or provide a Spreadsheet ID.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorDetails(null);
      setStatusMessage(`Synchronizing ${students.length} students across 18 subjects into Google Sheets...`);

      const result = await GoogleSheetsService.syncAllToSpreadsheet(
        accessToken,
        targetId,
        students,
        teachers,
        settings
      );

      if (result.success) {
        setSheetsConfig(prev => ({
          ...prev,
          spreadsheetId: targetId,
          spreadsheetUrl: result.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${targetId}/edit`,
          lastSyncedAt: new Date().toLocaleTimeString(),
          status: 'success',
        }));
        setStatusMessage(result.message);
        addLog('Google Sheets Synced', `Pushed ${students.length} student scores to Google Sheets`);
      } else {
        setErrorDetails(result.message);
      }
    } catch (err: unknown) {
      setErrorDetails(err instanceof Error ? err.message : 'Synchronization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0f2438] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow">
              <Sheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Google Sheets Synchronization Hub</h3>
              <p className="text-xs text-slate-300">
                Synchronize independent marks with Centralized Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Method Tabs: Choose how to sync with Google Sheets */}
          <div className="flex border-b border-slate-200 bg-slate-100 p-1.5 rounded-xl gap-1">
            <button
              onClick={() => setActiveSyncMethod('oauth')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activeSyncMethod === 'oauth'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CloudUpload className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Direct Google Drive Sync</span>
            </button>
            <button
              onClick={() => setActiveSyncMethod('webhook')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activeSyncMethod === 'webhook'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Apps Script Webhook</span>
            </button>
            <button
              onClick={() => setActiveSyncMethod('direct_file')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
                activeSyncMethod === 'direct_file'
                  ? 'bg-white text-emerald-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
              <span>3. 1-Click Sheets File</span>
            </button>
          </div>

          {/* TAB 1: DIRECT GOOGLE DRIVE SYNC (OAUTH) */}
          {activeSyncMethod === 'oauth' && (
            <div className="space-y-4">
              {/* Account Status Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.26 21.36 7.35 24 12 24z"/>
                      <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.13z"/>
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Google Account Authorization</div>
                    <div className="font-bold text-slate-800 text-xs truncate max-w-[200px] sm:max-w-xs">
                      {firebaseUser ? firebaseUser.email : 'Not signed in'}
                    </div>
                  </div>
                </div>

                {!firebaseUser ? (
                  <button
                    onClick={handleConnect}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    Connect Google
                  </button>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Connected
                  </span>
                )}
              </div>

              {/* Linked Spreadsheet Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Linked Google Spreadsheet
                  </span>
                  {sheetsConfig.lastSyncedAt && (
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Last Synced: <strong>{sheetsConfig.lastSyncedAt}</strong>
                    </span>
                  )}
                </div>

                {sheetsConfig.spreadsheetUrl ? (
                  <div className="p-3 bg-white border border-emerald-300 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-2.5 truncate mr-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {settings.schoolName} - Master Examination Broadsheet
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 truncate">
                          ID: {sheetsConfig.spreadsheetId}
                        </div>
                      </div>
                    </div>

                    <a
                      href={sheetsConfig.spreadsheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shrink-0 transition shadow-xs"
                    >
                      <span>Open Sheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-dashed border-slate-300">
                    No spreadsheet currently linked. Click <strong>"Create Master Spreadsheet"</strong> below to automatically provision a cloud sheet with tabs for each class and subject.
                  </div>
                )}

                {/* Easy URL / ID Link Box */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Paste Google Sheet URL or Spreadsheet ID:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit"
                      value={manualIdInput}
                      onChange={e => setManualIdInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 text-xs rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                    />
                    <button
                      onClick={handleLinkExistingSheet}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition"
                    >
                      Link Sheet
                    </button>
                  </div>
                </div>

                {/* Auto-Sync Toggle */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={sheetsConfig.autoSync}
                      onChange={e =>
                        setSheetsConfig(prev => ({ ...prev, autoSync: e.target.checked }))
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Auto-Sync in background when scores are entered</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleCreateNewSheet}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-300" />
                  <span>Create Master Google Sheet</span>
                </button>

                <button
                  onClick={handleSyncToSheets}
                  disabled={isProcessing}
                  className="flex items-center justify-center space-x-2 py-2.5 px-4 bg-red-950 hover:bg-black disabled:bg-slate-400 text-amber-300 hover:text-white rounded-xl text-xs font-bold shadow-md border border-amber-400/60 transition"
                >
                  <CloudUpload className="w-4 h-4 text-amber-400" />
                  <span>Sync All Records to Sheet</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: APPS SCRIPT WEBHOOK SYNC (ZERO LOGIN NEEDED) */}
          {activeSyncMethod === 'webhook' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-950 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-blue-900">
                  <Link2 className="w-4 h-4" />
                  <span>Zero-Login Google Sheets Webhook Sync</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  Sync student scores directly into your Google Sheet without logging into personal Google accounts. Simply deploy a 5-line Google Apps Script Web App in your spreadsheet and paste the URL here.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Google Apps Script Web App URL *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={webhookUrlInput}
                    onChange={e => setWebhookUrlInput(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 text-xs rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                  <button
                    onClick={handleWebhookSync}
                    disabled={isProcessing || !webhookUrlInput.trim()}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-lg transition"
                  >
                    Transmit Now
                  </button>
                </div>
              </div>

              {/* Accordion: How to setup in 1 minute */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowWebhookGuide(!showWebhookGuide)}
                  className="w-full px-3.5 py-2.5 text-left font-bold text-xs text-slate-800 flex items-center justify-between hover:bg-slate-100 transition"
                >
                  <span>View 3-Step Google Apps Script Setup Guide</span>
                  <span className="text-slate-400 text-xs">{showWebhookGuide ? '▲' : '▼'}</span>
                </button>

                {showWebhookGuide && (
                  <div className="p-3.5 border-t border-slate-200 bg-white space-y-2.5 text-xs text-slate-600">
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>Open your Google Sheet, click <strong>Extensions</strong> → <strong>Apps Script</strong>.</li>
                      <li>Replace existing code with the snippet below and click <strong>Save</strong>.</li>
                      <li>Click <strong>Deploy</strong> → <strong>New deployment</strong> → Select <strong>Web app</strong> (Execute as: <em>Me</em>, Who has access: <em>Anyone</em>) → Click <strong>Deploy</strong> and copy the URL.</li>
                    </ol>

                    <div className="relative">
                      <pre className="p-2.5 bg-slate-900 text-amber-200 rounded-lg text-[10px] font-mono overflow-x-auto max-h-36">
                        {GoogleSheetsService.getAppsScriptCode()}
                      </pre>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(GoogleSheetsService.getAppsScriptCode());
                          alert('Apps Script code copied to clipboard!');
                        }}
                        className="absolute top-2 right-2 px-2 py-1 bg-amber-400 text-red-950 font-bold text-[10px] rounded shadow hover:bg-amber-300"
                      >
                        Copy Script Code
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 1-CLICK SHEETS WORKBOOK (.XLSX) */}
          {activeSyncMethod === 'direct_file' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 space-y-2">
                <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span>1-Click Master Google Sheets Workbook (.xlsx)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-700">
                  Instantly download the entire school examination records as an Excel spreadsheet configured with tabs for <strong>Overview</strong>, <strong>JSS 1 A Broadsheet</strong>, <strong>SSS 1 A Broadsheet</strong>, and all official levels. You can upload or drag this file directly into Google Drive / Google Sheets.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Export All {students.length} Learners Across {SCHOOL_CLASSES.length} Classes
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Includes CA1 (5%), CA2 (5%), CA3 (10%), CA4 (10%), Exams (70%), Totals, and Ranks
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportGoogleSheetsFile}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 mx-auto"
                >
                  <Download className="w-4 h-4 text-amber-300" />
                  <span>Download Google Sheets Master File (.xlsx)</span>
                </button>
              </div>
            </div>
          )}

          {/* Feedback & Progress */}
          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-medium">{statusMessage}</div>
            </div>
          )}

          {errorDetails && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="font-medium">{errorDetails}</div>
            </div>
          )}

          {/* Sync Information Details */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-700">How Synchronization Works:</div>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Each class (SSS 1 A, SSS 1 B, etc.) gets its own formatted broadsheet tab in Google Sheets.</li>
              <li>Calculates all CA1 (5%), CA2 (5%), CA3 (10%), CA4 (10%), and Exams (70%) into 100% total with grade.</li>
              <li>Allows independent teachers to push updates securely without overwriting each other's subjects.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
