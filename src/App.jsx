import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Building2, 
  User, 
  Mail, 
  Upload, 
  Search, 
  Image,
  Database, 
  Plus,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Schema voor het GITEX lead formulier
const gitexLeadSchema = z.object({
  company: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  photos: z.instanceof(FileList).optional(),
});

function App() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("new");
  
  // Database tab state
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  
  // Formulier setup
  const form = useForm({
    resolver: zodResolver(gitexLeadSchema),
    defaultValues: {
      company: "",
      contactPerson: "",
      email: "",
    }
  });
  
  // Lead details weergeven
  const viewLeadDetails = (lead) => {
    setSelectedLead(lead);
    setPhotos([]);
    setIsLoadingPhotos(true);
    
    // Foto's ophalen voor deze lead
    fetch(`/api/gitex-leads/${lead.id}/photos`)
      .then(response => response.json())
      .then(data => {
        if (data.success && data.data.photoUrls) {
          setPhotos(data.data.photoUrls);
        } else {
          console.error("Geen foto's gevonden of fout bij ophalen:", data.error);
          setPhotos([]);
        }
      })
      .catch(error => {
        console.error("Fout bij ophalen van foto's:", error);
        setPhotos([]);
      })
      .finally(() => {
        setIsLoadingPhotos(false);
      });
  };
  
  // Formulier verwerken
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Formulierdata voorbereiden
      const formData = new FormData();
      formData.append('company', data.company || '');
      formData.append('contactPerson', data.contactPerson || '');
      formData.append('email', data.email || '');
      
      // Foto's toevoegen (indien aanwezig)
      if (data.photos) {
        for (let i = 0; i < data.photos.length; i++) {
          formData.append('photos', data.photos[i]);
        }
      }
      
      // Verstuur de data naar de API
      const response = await fetch('/api/gitex-leads', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Er is een fout opgetreden');
      }
      
      // Toon een succesmelding
      toast({
        title: "Lead succesvol opgeslagen!",
        description: "GITEX lead is opgeslagen in de database.",
        variant: "default",
      });
      
      // Reset het formulier en toon de success view
      form.reset();
      setIsSubmitted(true);
      
      // Reset na 3 seconden
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error("Fout bij versturen van het formulier:", error);
      
      toast({
        title: "Er is een fout opgetreden",
        description: error instanceof Error ? error.message : "Kon het formulier niet verwerken",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Leads ophalen bij tab wissel
  useEffect(() => {
    if (activeTab === "database") {
      setIsLoading(true);
      
      fetch('/api/gitex-leads')
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setLeads(data.data);
          } else {
            console.error("Fout bij ophalen van leads:", data.error);
            setLeads([]);
          }
        })
        .catch(error => {
          console.error("Fout bij ophalen van leads:", error);
          setLeads([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [activeTab]);
  
  // Leads filteren op basis van zoekterm
  const filteredLeads = leads.filter(lead => {
    const searchTerms = searchQuery.toLowerCase();
    
    return (
      (lead.company?.toLowerCase().includes(searchTerms) ?? false) ||
      (lead.contact_person?.toLowerCase().includes(searchTerms) ?? false) ||
      (lead.email?.toLowerCase().includes(searchTerms) ?? false)
    );
  });
  
  // Success view component
  const SuccessView = () => (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Lead Registered!</h2>
        <p className="text-gray-600">Your GITEX lead has been successfully saved to the database.</p>
        <Button 
          onClick={() => setIsSubmitted(false)}
          className="w-full"
        >
          Add Another Lead
        </Button>
      </div>
    </div>
  );
  
  // Database view - full screen
  const DatabaseView = () => (
    <div className="space-y-4 h-[calc(100vh-12rem)] flex flex-col p-0">
      <div className="flex items-center gap-3 bg-gray-50 rounded-md p-2 border mx-4 mt-4">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          placeholder="Search leads by company, contact or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-8"
        />
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-[#73b729] animate-spin" />
            <p className="text-gray-500">Loading leads...</p>
          </div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center mx-4">
          <div className="w-full py-16 text-center border-2 border-dashed rounded-lg">
            <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">No leads found</p>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4">
          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0">
                <TableRow>
                  <TableHead className="w-12 font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Company</TableHead>
                  <TableHead className="w-24 font-semibold text-center">Photos</TableHead>
                  <TableHead className="w-32 font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map(lead => (
                  <TableRow 
                    key={lead.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => viewLeadDetails(lead)}
                  >
                    <TableCell className="font-mono text-xs text-gray-600">{lead.id}</TableCell>
                    <TableCell className="font-medium">{lead.company || "Unnamed Lead"}</TableCell>
                    <TableCell className="text-center">
                      {lead.photo_paths && lead.photo_paths.length > 0 ? (
                        <Badge className="bg-[#73b729] hover:bg-[#73b729]/90">
                          {lead.photo_paths.length} file{lead.photo_paths.length !== 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-xs text-gray-500 py-2 px-1 text-center">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>
      )}
      
      {/* Selected lead details - clean fullscreen design for mobile */}
      {selectedLead && (
        <div 
          className="fixed inset-0 z-50 bg-white"
          onClick={() => setSelectedLead(null)}
        >
          <div 
            className="w-full h-full flex flex-col bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#2c3242] py-3 px-4 text-white">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center">
                  <span className="bg-[#73b729]/20 text-[#73b729] px-2 py-1 rounded-md text-sm mr-2">#{selectedLead.id}</span>
                  {selectedLead.company || "Unnamed Lead"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedLead(null)}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            {/* Scrollable content */}
            <div className="overflow-auto flex-1 bg-gray-50">
              <div className="p-4 max-w-md mx-auto">
                {/* Lead details - card layout */}
                <div className="bg-white rounded-lg shadow-sm mb-4">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Lead Details</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-medium text-[#73b729] mb-1">Company</h4>
                        <p className="text-base">{selectedLead.company || "—"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-[#73b729] mb-1">Contact Person</h4>
                        <p className="text-base">{selectedLead.contact_person || "—"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-[#73b729] mb-1">Email</h4>
                        <p className="text-base break-all">{selectedLead.email || "—"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-medium text-[#73b729] mb-1">Created At</h4>
                        <p className="text-base">{new Date(selectedLead.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Photos */}
                <div className="bg-white rounded-lg shadow-sm mb-4">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-500">Photos</h3>
                      <Badge variant="outline" className="font-medium">
                        {photos.length} image{photos.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {isLoadingPhotos ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 text-[#73b729] animate-spin mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Loading photos...</p>
                        </div>
                      </div>
                    ) : photos.length === 0 ? (
                      <div className="flex items-center justify-center h-40 border border-dashed rounded-md">
                        <div className="text-center">
                          <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No photos available</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {photos.map((url, index) => (
                          <a 
                            key={index}
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group"
                          >
                            <div className="overflow-hidden rounded-md border aspect-square relative">
                              <img 
                                src={url} 
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/40">
                                <div className="bg-white rounded-full p-2">
                                  <ExternalLink className="h-4 w-4 text-[#2c3242]" />
                                </div>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer with close button */}
            <div className="p-4 border-t bg-white">
              <Button
                className="w-full bg-[#73b729] hover:bg-[#73b729]/90 text-white"
                onClick={() => setSelectedLead(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  if (isSubmitted) {
    return <SuccessView />;
  }
  
  return (
    <div className="min-h-screen bg-white relative overflow-hidden px-0 pt-0 pb-4 sm:px-6 sm:py-8">
      {/* Background patterns - only shown on desktop */}
      <div className="absolute inset-0 opacity-10 hidden sm:block">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#73b729 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      <div className={cn("relative z-10 h-[calc(100vh-1rem)]", activeTab === "database" ? "w-full" : "w-full max-w-md mx-auto")}>
        <Card className={cn(
          "w-full border-0 bg-white/95 backdrop-blur-sm rounded-none overflow-hidden sm:rounded-xl h-full", 
          activeTab === "database" ? "shadow-none" : "shadow-xl"
        )}>
          <CardHeader className="bg-gradient-to-r from-[#2c3242] to-[#3a4357] text-white pb-3 pt-4 px-4 sm:pb-5 sm:pt-6 sm:px-6">
            <div className="flex flex-row justify-between items-center gap-2">
              <div>
                <CardTitle className="text-lg sm:text-2xl font-bold">
                  GITEX LEADS
                </CardTitle>
                <CardDescription className="text-gray-200 mt-0.5 text-xs sm:text-sm">
                  Quick lead capture form for GITEX event
                </CardDescription>
              </div>
              <Logo className="w-20 sm:w-24" showText={false} />
            </div>
          </CardHeader>
          
          <CardContent className={cn("p-0 flex flex-col", activeTab === "database" ? "h-[calc(100%-4rem)]" : "h-[calc(100%-4rem)]")}>
            <Tabs 
              defaultValue="new" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full flex-1 flex flex-col"
            >
              <TabsList className="w-full rounded-none grid grid-cols-2 bg-gray-100 h-12">
                <TabsTrigger value="new" className="py-2 text-sm data-[state=active]:bg-white">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  New Lead
                </TabsTrigger>
                <TabsTrigger value="database" className="py-2 text-sm data-[state=active]:bg-white">
                  <Database className="h-3.5 w-3.5 mr-1.5" />
                  Database
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="new" className="mt-0 flex-1 flex flex-col">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 flex-1 flex flex-col">
                    <div className="flex-1 overflow-auto">
                      <div className="max-w-md mx-auto space-y-6">
                        <FormField
                          control={form.control}
                          name="company"
                          render={({ field }) => (
                            <FormControl>
                              <div className="space-y-2">
                                <FormLabel className="text-base flex items-center text-[#2c3242]">
                                  <Building2 className="w-4 h-4 mr-1.5" />
                                  Company
                                  <span className="text-gray-400 text-xs ml-1">(optional)</span>
                                </FormLabel>
                                <Input
                                  placeholder="Company name"
                                  {...field}
                                  className="bg-gray-50 border-gray-200"
                                />
                                <FormMessage />
                              </div>
                            </FormControl>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contactPerson"
                          render={({ field }) => (
                            <FormControl>
                              <div className="space-y-2">
                                <FormLabel className="text-base flex items-center text-[#2c3242]">
                                  <User className="w-4 h-4 mr-1.5" />
                                  Contact Person
                                  <span className="text-gray-400 text-xs ml-1">(optional)</span>
                                </FormLabel>
                                <Input
                                  placeholder="Contact person name"
                                  {...field}
                                  className="bg-gray-50 border-gray-200"
                                />
                                <FormMessage />
                              </div>
                            </FormControl>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormControl>
                              <div className="space-y-2">
                                <FormLabel className="text-base flex items-center text-[#2c3242]">
                                  <Mail className="w-4 h-4 mr-1.5" />
                                  Email
                                  <span className="text-gray-400 text-xs ml-1">(optional)</span>
                                </FormLabel>
                                <Input
                                  type="email"
                                  placeholder="Contact email"
                                  {...field}
                                  className="bg-gray-50 border-gray-200"
                                />
                                <FormMessage />
                              </div>
                            </FormControl>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="photos"
                          render={({ field: { onChange, value, ...fieldProps } }) => (
                            <FormControl>
                              <div className="space-y-2">
                                <FormLabel className="text-base flex items-center text-[#2c3242]">
                                  <Image className="w-4 h-4 mr-1.5" />
                                  Photos
                                  <span className="text-gray-400 text-xs ml-1">(optional)</span>
                                </FormLabel>
                                
                                <div className="flex items-center justify-center w-full">
                                  <label 
                                    htmlFor="dropzone-file" 
                                    className={cn(
                                      "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100",
                                      value && value.length > 0 ? "border-[#73b729] bg-[#73b729]/5" : "border-gray-300"
                                    )}
                                  >
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                      <Upload className={cn(
                                        "w-8 h-8 mb-2",
                                        value && value.length > 0 ? "text-[#73b729]" : "text-gray-400"
                                      )} />
                                      
                                      {value && value.length > 0 ? (
                                        <div className="text-center">
                                          <p className="text-sm text-[#73b729] font-medium">
                                            {value.length} file{value.length !== 1 ? 's' : ''} selected
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            Click to change
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="text-center">
                                          <p className="text-sm text-gray-500">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1">
                                            JPG, PNG or JPEG (max 5 files)
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <input 
                                      id="dropzone-file" 
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(e) => {
                                        onChange(e.target.files);
                                      }}
                                      {...fieldProps}
                                    />
                                  </label>
                                </div>
                                <FormMessage />
                              </div>
                            </FormControl>
                          )}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-6 mt-auto">
                      <Button 
                        type="submit" 
                        className="w-full bg-[#73b729] hover:bg-[#73b729]/90 text-white"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>Submit Lead</>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="database" className="mt-0 flex-1 flex flex-col">
                <DatabaseView />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {activeTab !== "database" && (
          <div className="mt-3 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Tecnarit. All rights reserved.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;