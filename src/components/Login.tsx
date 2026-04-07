import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';
import { GraduationCap } from 'lucide-react';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const symbolsContainerRef = useRef<HTMLDivElement>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const symbols = ["+", "−", "×", "÷", "π", "√", "∑", "=", "≠", "∫", "∞", "∂", "∇", "∈", "∉", "∩", "∪", "⊂", "⊃", "⊆", "⊇", "∧", "∨", "¬", "∀", "∃", "∈", "∉", "∋", "∌", "∏", "∐", "∑", "−", "∓", "∔", "∕", "∖", "∗", "∘", "∙", "√", "∛", "∜", "∝", "∞", "∟", "∠", "∡", "∢", "∣", "∤", "∥", "∦", "∧", "∨", "∩", "∪", "∫", "∬", "∭", "∮", "∯", "∰", "∱", "∲", "∳", "∴", "∵", "∶", "∷", "∸", "∹", "∺", "∻", "∼", "∽", "∾", "∿", "≀", "≁", "≂", "≃", "≄", "≅", "≆", "≇", "≈", "≉", "≊", "≋", "≌", "≍", "≎", "≏", "≐", "≑", "≒", "≓", "≔", "≕", "≖", "≗", "≘", "≙", "≚", "≛", "≜", "≝", "≞", "≟", "≠", "≡", "≢", "≣", "≤", "≥", "≦", "≧", "≨", "≩", "≪", "≫", "≬", "≭", "≮", "≯", "≰", "≱", "≲", "≳", "≴", "≵", "≶", "≷", "≸", "≹", "≺", "≻", "≼", "≽", "≾", "≿", "⊀", "⊁", "⊂", "⊃", "⊄", "⊅", "⊆", "⊇", "⊈", "⊉", "⊊", "⊋", "⊌", "⊍", "⊎", "⊏", "⊐", "⊑", "⊒", "⊓", "⊔", "⊕", "⊖", "⊗", "⊘", "⊙", "⊚", "⊛", "⊜", "⊝", "⊞", "⊟", "⊠", "⊡", "⊢", "⊣", "⊤", "⊥", "⊦", "⊧", "⊨", "⊩", "⊪", "⊫", "⊬", "⊭", "⊮", "⊯", "⊰", "⊱", "⊲", "⊳", "⊴", "⊵", "⊶", "⊷", "⊸", "⊹", "⊺", "⊻", "⊼", "⊽", "⊾", "⊿", "⋀", "⋁", "⋂", "⋃", "⋄", "⋅", "⋆", "⋇", "⋈", "⋉", "⋊", "⋋", "⋌", "⋍", "⋎", "⋏", "⋐", "⋑", "⋒", "⋓", "⋔", "⋕", "⋖", "⋗", "⋘", "⋙", "⋚", "⋛", "⋜", "⋝", "⋞", "⋟","@", "#", "$", "%", "&", "*", "!", "?", "~", "^", "_", "`", "|", ":", ";", "\"", "'", "<", ">", "/", "\\", "(", ")", "[", "]", "{", "}", "-", "+", "=", "±", "×", "÷", "∑", "∏", "∐", "∫", "∬", "∭", "∮", "∯", "∰", "∱", "∲", "∳", "∴", "∵", "∶", "∷", "∸", "∹", "∺", "∻", "∼", "∽", "∾", "∿", "≀", "≁", "≂", "≃", "≄", "≅", "≆", "≇", "≈", "≉", "≊", "≋", "≌", "≍", "≎", "≏", "≐", "≑", "≒", "≓", "≔", "≕", "≖", "≗", "≘", "≙", "≚", "≛", "≜", "≝", "≞", "≟", "≠", "≡", "≢", "≣", "≤", "≥", "≦", "≧", "≨", "≩", "≪", "≫", "≬", "≭", "≮", "≯", "≰", "≱", "≲", "≳", "≴", "≵", "≶", "≷", "≸", "≹", "≺", "≻", "≼", "≽", "≾", "≿"];

    const createSymbol = () => {
      if (!symbolsContainerRef.current) return;
      const symbol = document.createElement("div");
      symbol.classList.add("symbol");
      symbol.innerText = symbols[Math.floor(Math.random() * symbols.length)];
      symbol.style.left = Math.random() * 100 + "vw";
      symbol.style.fontSize = (20 + Math.random() * 30) + "px";
      symbol.style.animationDuration = (4 + Math.random() * 4) + "s";
      symbolsContainerRef.current.appendChild(symbol);
      setTimeout(() => {
        symbol.remove();
      }, 17000);
    };

    const interval = setInterval(createSymbol, 350);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 8;

    const shapes: any[] = [];
    const colors = [0x38bdf8, 0x818cf8, 0x34d399];
    const geometries = [
      new THREE.IcosahedronGeometry(1.4, 0),
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.TetrahedronGeometry(1.0, 0),
      new THREE.TorusGeometry(0.9, 0.32, 12, 40),
    ];

    for (let i = 0; i < 15; i++) {
      const g = geometries[i % geometries.length];
      const c = colors[i % colors.length];
      const mat = new THREE.MeshPhongMaterial({ color: c, transparent: true, opacity: 0.12 });
      const wire = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.2, wireframe: true });
      const m = new THREE.Mesh(g, mat);
      const w = new THREE.Mesh(g, wire);
      
      const x = (Math.random() - 0.5) * 14;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 4 - 2;
      
      m.position.set(x, y, z);
      w.position.set(x, y, z);
      scene.add(m);
      scene.add(w);
      
      shapes.push({
        m, w,
        rx: (Math.random() - 0.5) * 0.01,
        ry: (Math.random() - 0.5) * 0.008
      });
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const pt = new THREE.PointLight(0x38bdf8, 1.5, 20);
    pt.position.set(0, 3, 5);
    scene.add(pt);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      requestAnimationFrame(animate);
      shapes.forEach(s => {
        s.m.rotation.x += s.rx;
        s.m.rotation.y += s.ry;
        s.w.rotation.copy(s.m.rotation);
      });
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (isLogin) {
      if (newRole === 'admin') {
        setEmail('admin@edulens.com');
        setPassword('admin123');
      } else if (newRole === 'teacher') {
        setEmail('teacher@edulens.com');
        setPassword('teach123');
      } else {
        setEmail('student@edulens.com');
        setPassword('student123');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          onLogin({ ...userDoc.data(), uid: userCredential.user.uid });
        } else {
          // Fallback if doc doesn't exist (e.g. legacy users)
          onLogin({ 
            email: userCredential.user.email, 
            role: 'student', 
            displayName: userCredential.user.displayName || 'User', 
            uid: userCredential.user.uid 
          });
        }
      } else {
        // Sign Up
        if (!displayName.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });

        const userData = {
          uid: userCredential.user.uid,
          email,
          displayName,
          role,
          createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
        onLogin(userData);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050a12]">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      <div ref={symbolsContainerRef} className="symbols-container" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="rounded-3xl border border-white/10 bg-[#0f1a2e]/80 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            {/* 3D Loading Animation & Logo */}
            <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
              {/* Outer 3D Rotating Rings */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-[#38bdf8]/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 rounded-full border border-dotted border-[#02c39a]/40"
              />
              
              {/* 3D Pulsing Sphere Background */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#02c39a] blur-xl"
              />

              {/* The Logo Container */}
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl bg-[#0b1220] p-2 shadow-[0_0_40px_rgba(56,189,248,0.2)] border border-white/10 overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <img 
                  src="image.png" 
                  alt="EduLens Logo" 
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                {/* Reflection Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-2xl pointer-events-none" />
              </motion.div>
            </div>

            <h2 className="font-syne text-3xl font-extrabold text-white">
              Edu<span className="text-[#38bdf8]">Lens</span>
            </h2>
            <p className="mt-2 font-instrument text-xs font-bold uppercase tracking-[0.2em] text-[#64748b]">
              Betterment for Every Student
            </p>
          </div>

          <div className="mb-6 flex gap-2 rounded-xl bg-[#0b1220] p-1">
            {(['admin', 'teacher', 'student'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 rounded-lg py-2 font-syne text-xs font-bold transition-all ${
                  role === r ? 'bg-[#38bdf8] text-[#050a12]' : 'text-[#64748b] hover:text-white'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="name-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 font-instrument text-sm text-white outline-none transition-all focus:border-[#38bdf8]"
                    placeholder="John Doe"
                    required={!isLogin}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 font-instrument text-sm text-white outline-none transition-all focus:border-[#38bdf8]"
                placeholder="you@school.edu"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-3 font-instrument text-sm text-white outline-none transition-all focus:border-[#38bdf8]"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-center text-xs text-[#f87171]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#38bdf8] py-3 font-syne text-sm font-extrabold text-[#050a12] transition-all hover:translate-y-[-2px] hover:bg-[#7dd3fc] hover:shadow-[0_8px_30px_rgba(56,189,248,0.3)] disabled:opacity-50"
            >
              {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In →' : 'Create Account →')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="font-instrument text-xs text-[#38bdf8] hover:underline"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>

          {isLogin && (
            <p className="mt-4 text-center font-instrument text-[10px] text-[#64748b]">
              {role === 'admin' ? (
                <>Admin: <span className="text-[#38bdf8]">admin@edulens.com</span> / <span className="text-[#38bdf8]">admin123</span></>
              ) : role === 'teacher' ? (
                <>Teacher: <span className="text-[#38bdf8]">teacher@edulens.com</span> / <span className="text-[#38bdf8]">teach123</span></>
              ) : (
                <>Student: <span className="text-[#38bdf8]">student@edulens.com</span> / <span className="text-[#38bdf8]">student123</span></>
              )}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
