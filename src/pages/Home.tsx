import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileText, Brain, Calendar, ArrowRight, Sparkles, Target, Clock, Github, Twitter, Linkedin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: FileText,
    title: 'Smart Summarizer',
    description: 'Transform lengthy texts into concise, meaningful summaries with AI-powered precision.',
    href: '/summarizer',
    gradient: 'from-blue-500 to-blue-600'
  },
  {
    icon: Brain,
    title: 'Interactive Flashcards',
    description: 'Create and study with dynamic flashcards that adapt to your learning pace.',
    href: '/flashcards',
    gradient: 'from-purple-500 to-purple-600'
  },
  {
    icon: Calendar,
    title: 'Smart Scheduler',
    description: 'Generate personalized study schedules that optimize your learning efficiency.',
    href: '/scheduler',
    gradient: 'from-green-500 to-green-600'
  }
];

const socialLinks = [
  { 
    icon: Github, 
    label: 'GitHub', 
    href: 'https://github.com/studymatelite',
    color: 'hover:text-foreground'
  },
  { 
    icon: Twitter, 
    label: 'Twitter', 
    href: 'https://twitter.com/studymatelite',
    color: 'hover:text-blue-500'
  },
  { 
    icon: Linkedin, 
    label: 'LinkedIn', 
    href: 'https://linkedin.com/company/studymatelite',
    color: 'hover:text-blue-600'
  },
  { 
    icon: Instagram, 
    label: 'Instagram', 
    href: 'https://instagram.com/studymatelite',
    color: 'hover:text-pink-500'
  }
];

const stats = [
  { icon: Target, label: 'Accuracy', value: '95%' },
  { icon: Clock, label: 'Time Saved', value: '60%' },
  { icon: Sparkles, label: 'User Rating', value: '4.9' }
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Welcome to
                </span>
                <br />
                <span className="text-foreground">StudyMate Lite</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Your AI-powered assistant for{' '}
                <span className="text-primary font-semibold">Summaries</span>,{' '}
                <span className="text-secondary font-semibold">Flashcards</span>, and{' '}
                <span className="text-success font-semibold">Scheduling</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link to="/summarizer">
                  <Button className="btn-hero group">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
                
                <div className="flex items-center space-x-6">
                  {stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-2">
                        <stat.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Powerful Features
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover the tools that will transform your learning experience and boost your academic performance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link to={feature.href} className="block group">
                  <div className="feature-card h-full">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors duration-200">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all duration-200">
                      Learn More
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h3 className="text-2xl font-semibold mb-8 text-foreground">
              Connect With Us
            </h3>
            
            <div className="flex justify-center items-center space-x-6">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`group p-4 rounded-full bg-background text-muted-foreground transition-all duration-300 ${social.color} hover:scale-110 hover:shadow-lg border border-border/50`}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
                  <span className="sr-only">{social.label}</span>
                </motion.a>
              ))}
            </div>
            
            <p className="text-muted-foreground mt-6 max-w-md mx-auto">
              Follow us for updates, study tips, and community discussions
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}