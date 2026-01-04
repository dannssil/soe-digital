import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  LayoutDashboard, Users, FileText, LogOut, 
  Search, Plus, Save, X, ChevronDown, CheckSquare, 
  AlertTriangle, Heart, BookOpen, Calendar, Folder, Camera,
  Phone, MapPin, User, Pencil
} from 'lucide-react';

// --- CONFIGURAÇÕES ---
const SYSTEM_USER_NAME = "Daniel Alves"; 
const SYSTEM_ROLE = "SOE - CED 4 Guará";

// --- LISTAS ---
const MOTIVOS_COMPORTAMENTO = [
  "Conversa excessiva em sala", "Desacato / falta de respeito",
  "Agressividade verbal", "Agressividade física", "Uso indevido de celular",
  "Saída de sala sem autorização", "Bullying / conflito com colegas", 
  "Desobediência às orientações", "Outros"
];
const MOTIVOS_PEDAGOGICO = [
  "Não realização de atividades", "Dificuldade de aprendizagem",
  "Falta de materiais", "Desatenção", "Desempenho abaixo do esperado",
  "Faltas excessivas / Infrequência", "Outros"
];
const MOTIVOS_SOCIAL = [
  "Ansiedade / desmotivação", "Problemas familiares",
  "Isolamento / dificuldade de socialização", "Queixas de colegas / professores",
  "Outros"
];
const ACOES_REALIZADAS = [
  "Escuta individual", "Mediação de conflito", "Comunicação à família",
  "Contato com professor", "Encaminhamento à coordenação", "Encaminhamento à direção"
];
const ENCAMINHAMENTOS = [
  "Coordenação pedagógica", "Psicologia escolar", "Família / responsáveis",
  "Direção", "Conselho Tutelar",
  "Sala de Recursos", "Equipe de Apoio à Aprendizagem", "Disciplinar"
];

// --- INTERFACES ---
interface Student {
  id: any; 
  name: string;      
  class_id: string;  
  turno?: string;
  guardian_name?: string;  
  guardian_phone?: string; 
  address?: string;        
  photo_url?: string; 
  logs?: Log[];
}

interface Log {
  id: number;
  created_at: string;
  category: string; 
  description: string;
  referral?: string;
  return_date?: string;
  resolved?: boolean;
}

// --- AVATAR ---
function Avatar({ name, src, size = "md" }: { name: string, src?: string | null, size?: "sm" | "md" | "lg" }) {
  const safeName = name || "Aluno";
  const initials = safeName.substring(0, 2).toUpperCase();
  const sizeClasses = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" };
  const pxSize = { sm: 32, md: 40, lg: 64 };
  
  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`${sizeClasses[size]} rounded-full object-cover shadow-sm ring-2 ring-white bg-gray-100`}
        style={{ width: pxSize[size], height: pxSize[size] }}
      />
    );
  }
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white`} style={{ width: pxSize[size], height: pxSize[size] }}>
      {initials}
    </div>
  );
}

// --- APP ---
export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [view, setView] = useState<'dashboard' | 'students'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [adminPhoto, setAdminPhoto] = useState<string | null>(localStorage.getItem('adminPhoto'));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados de EDIÇÃO
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editTurno, setEditTurno] = useState('');
  const [editGuardian, setEditGuardian] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Form Novo Aluno
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newTurno, setNewTurno] = useState('Matutino');
  const [newResponsavel, setNewResponsavel] = useState('');
  const [newPhone, setNewPhone] = useState('');   
  const [newAddress, setNewAddress] = useState(''); 
  
  // Form Atendimento
  const [solicitante, setSolicitante] = useState('Professor');
  const [motivosSelecionados, setMotivosSelecionados] = useState<string[]>([]);
  const [acoesSelecionadas, setAcoesSelecionadas] = useState<string[]>([]);
  const [encaminhamento, setEncaminhamento] = useState('');
  const [dataRetorno, setDataRetorno] = useState('');
  const [resolvido, setResolvido] = useState(false);
  
  const DEFAULT_OBS = "Relatório de Atendimento:\n\n- Relato do estudante:\n\n- Mediação realizada:\n\n- Combinados:";
  const [obsLivre, setObsLivre] = useState(DEFAULT_OBS);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('students') 
      .select(`*, logs(id, category, description, created_at, referral, resolved, return_date)`)
      .order('name'); 

    if (error) {
      setErrorMsg(`Erro de conexão: ${error.message}`);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  }

  // --- FUNÇÕES DE EDIÇÃO ---
  function startEditing() {
    if (!selectedStudent) return;
    setEditName(selectedStudent.name);
    setEditClass(selectedStudent.class_id);
    setEditTurno(selectedStudent.turno || 'Matutino');
    setEditGuardian(selectedStudent.guardian_name || '');
    setEditPhone(selectedStudent.guardian_phone || '');
    setEditAddress(selectedStudent.address || '');
    setIsEditing(true);
  }

  async function saveEdits() {
    if (!selectedStudent) return;
    
    const { error } = await supabase
      .from('students')
      .update({
        name: editName,
        class_id: editClass,
        turno: editTurno,
        guardian_name: editGuardian,
        guardian_phone: editPhone,
        address: editAddress
      })
      .eq('id', selectedStudent.id);

    if (error) {
      alert('Erro ao atualizar: ' + error.message);
    } else {
      alert('Dados atualizados com sucesso!');
      setIsEditing(false);
      // Atualiza o local e a lista
      const updatedStudent = { 
        ...selectedStudent, 
        name: editName, class_id: editClass, turno: editTurno, 
        guardian_name: editGuardian, guardian_phone: editPhone, address: editAddress 
      };
      setSelectedStudent(updatedStudent);
      fetchStudents();
    }
  }

  // Upload Fotos
  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0 || !selectedStudent) return;
    setUploading(true);
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${selectedStudent.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;
    const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file);
    if (uploadError) { alert('Erro no upload: ' + uploadError.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);
    const { error: updateError } = await supabase.from('students').update({ photo_url: publicUrl }).eq('id', selectedStudent.id);
    if (updateError) alert('Erro ao salvar link: ' + updateError.message);
    else {
      setSelectedStudent({ ...selectedStudent, photo_url: publicUrl });
      fetchStudents();
    }
    setUploading(false);
  }

  function handleAdminPhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAdminPhoto(result);
        localStorage.setItem('adminPhoto', result);
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || !newClass) return;
    const { error } = await supabase.from('students').insert([{ name: newName, class_id: newClass, turno: newTurno, guardian_name: newResponsavel, guardian_phone: newPhone, address: newAddress }]);
    if (error) alert('Erro ao cadastrar: ' + error.message);
    else {
      alert('Aluno cadastrado!');
      setNewName(''); setNewClass(''); setNewResponsavel(''); setNewPhone(''); setNewAddress('');
      setIsNewStudentModalOpen(false);
      fetchStudents();
    }
  }

  async function handleSaveLog() {
    if (!selectedStudent) return;
    const descriptionCompiled = JSON.stringify({ solicitante, motivos: motivosSelecionados, acoes: acoesSelecionadas, obs: obsLivre });
    const { error } = await supabase.from('logs').