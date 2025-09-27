"use client"

import { useState, useEffect } from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, MessageSquare, Eye, Send, Menu, Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ContactMessage {
  id: string
  first_name: string
  last_name: string
  email: string
  subject: string
  message: string
  status: 'unread' | 'read' | 'responded'
  admin_response?: string
  responded_at?: string
  created_at: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [responseDialogOpen, setResponseDialogOpen] = useState(false)
  const [responseText, setResponseText] = useState("")
  const [isSendingResponse, setIsSendingResponse] = useState(false)
  const [responseSuccess, setResponseSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAdminAndLoadMessages = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/auth/login")
        return
      }

      // Check if admin
      if (authUser.email !== 'admin@gmail.com') {
        router.push("/dashboard")
        return
      }

      setIsAdmin(true)
      setUserName(`${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim() || 'Admin')
      setUserEmail(authUser.email || '')

      fetchMessages()
    }

    checkAdminAndLoadMessages()
  }, [supabase, router])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.map(msg =>
        msg.id === messageId ? { ...msg, status: 'read' as const } : msg
      ))
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  const sendResponse = async () => {
    if (!selectedMessage || !responseText.trim()) return

    setIsSendingResponse(true)
    try {
      // Send email response (placeholder - would integrate with email service)
      console.log('Sending response to:', selectedMessage.email, 'Response:', responseText)

      // For now, just update the database
      const { error } = await supabase
        .from('contact_messages')
        .update({
          status: 'responded',
          admin_response: responseText,
          responded_at: new Date().toISOString(),
          responded_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedMessage.id)

      if (error) throw error

      setMessages(messages.map(msg =>
        msg.id === selectedMessage.id
          ? {
              ...msg,
              status: 'responded' as const,
              admin_response: responseText,
              responded_at: new Date().toISOString()
            }
          : msg
      ))

      setResponseSuccess(true)
      setTimeout(() => {
        setResponseDialogOpen(false)
        setResponseText("")
        setResponseSuccess(false)
        setSelectedMessage(null)
      }, 2000)

    } catch (error) {
      console.error('Error sending response:', error)
      alert('Failed to send response. Please try again.')
    } finally {
      setIsSendingResponse(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-red-100 text-red-800'
      case 'read': return 'bg-yellow-100 text-yellow-800'
      case 'responded': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center">
          <Alert variant="destructive">
            <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <DashboardSidebar
          userRole="admin"
          userName={userName}
          userEmail={userEmail}
          isMobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Desktop Sidebar */}
      <DashboardSidebar
        userRole="admin"
        userName={userName}
        userEmail={userEmail}
      />

      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-background border-b border-border p-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
            className="border-border hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Messages</h1>
          <div className="w-8" />
        </div>

        <div className="p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Contact Messages</h1>
              <p className="text-muted-foreground">
                View and respond to customer inquiries and support requests.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{messages.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unread</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {messages.filter(m => m.status === 'unread').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Responded</CardTitle>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {messages.filter(m => m.status === 'responded').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {messages.length > 0 ? Math.round((messages.filter(m => m.status === 'responded').length / messages.length) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Messages</CardTitle>
                <CardDescription>
                  Customer inquiries and support requests. Click on a message to view details and respond.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[200px]">Subject</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Date</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="font-medium">
                            {message.first_name} {message.last_name}
                          </TableCell>
                          <TableCell>{message.email}</TableCell>
                          <TableCell className="max-w-xs truncate" title={message.subject}>
                            {message.subject}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(message.status)}>
                              {message.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(message.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMessage(message)
                                      if (message.status === 'unread') {
                                        markAsRead(message.id)
                                      }
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{message.subject}</DialogTitle>
                                    <DialogDescription>
                                      From {message.first_name} {message.last_name} ({message.email})
                                      <br />
                                      Sent on {new Date(message.created_at).toLocaleString()}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label className="font-semibold">Message:</Label>
                                      <div className="mt-2 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                                        {message.message}
                                      </div>
                                    </div>
                                    {message.admin_response && (
                                      <div>
                                        <Label className="font-semibold">Your Response:</Label>
                                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg whitespace-pre-wrap">
                                          {message.admin_response}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          Responded on {message.responded_at ? new Date(message.responded_at).toLocaleString() : 'Unknown'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {message.status !== 'responded' && (
                                <Dialog open={responseDialogOpen && selectedMessage?.id === message.id} onOpenChange={(open) => {
                                  setResponseDialogOpen(open)
                                  if (!open) {
                                    setSelectedMessage(null)
                                    setResponseText("")
                                    setResponseSuccess(false)
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedMessage(message)
                                        setResponseText("")
                                        setResponseSuccess(false)
                                      }}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Respond to Message</DialogTitle>
                                      <DialogDescription>
                                        Send a response to {message.first_name} {message.last_name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="response">Response Message</Label>
                                        <Textarea
                                          id="response"
                                          value={responseText}
                                          onChange={(e) => setResponseText(e.target.value)}
                                          placeholder="Type your response here..."
                                          rows={6}
                                        />
                                      </div>

                                      {responseSuccess && (
                                        <Alert className="border-green-200 bg-green-50">
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                          <AlertDescription className="text-green-800">
                                            Response sent successfully!
                                          </AlertDescription>
                                        </Alert>
                                      )}

                                      <div className="flex justify-end gap-2">
                                        <Button
                                          variant="outline"
                                          onClick={() => setResponseDialogOpen(false)}
                                          disabled={isSendingResponse}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={sendResponse}
                                          disabled={isSendingResponse || !responseText.trim()}
                                        >
                                          {isSendingResponse ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                              Sending...
                                            </>
                                          ) : (
                                            <>
                                              <Send className="h-4 w-4 mr-2" />
                                              Send Response
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}