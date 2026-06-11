import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../viewmodels/chat_viewmodel.dart';

class JanaChatView extends StatefulWidget {
  const JanaChatView({super.key});

  @override
  State<JanaChatView> createState() => _JanaChatViewState();
}

class _JanaChatViewState extends State<JanaChatView> {
  final ChatViewModel _chatViewModel = ChatViewModel();
  final TextEditingController _textController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _chatViewModel.initChat();
  }

  @override
  void dispose() {
    _chatViewModel.dispose();
    _textController.dispose();
    super.dispose();
  }

  void _handleSendMessage() {
    _chatViewModel.sendMessage(_textController.text);
    _textController.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: MediaQuery.of(context).size.width >= 768
          ? null
          : AppBar(
              title: const Row(
                children: [
                  Icon(LucideIcons.bot, color: Color(0xFF047857)),
                  SizedBox(width: 8),
                  Text('Jana AI Assistant'),
                ],
              ),
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF0F172A),
              elevation: 1,
            ),
      body: ListenableBuilder(
        listenable: _chatViewModel,
        builder: (context, _) {
          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _chatViewModel.messages.length,
                  itemBuilder: (context, index) {
                    final msg = _chatViewModel.messages[index];
                    return Align(
                      alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                        decoration: BoxDecoration(
                          color: msg.isUser ? const Color(0xFF047857) : Colors.white,
                          borderRadius: BorderRadius.circular(16).copyWith(
                            bottomRight: msg.isUser ? const Radius.circular(0) : const Radius.circular(16),
                            bottomLeft: msg.isUser ? const Radius.circular(16) : const Radius.circular(0),
                          ),
                          border: msg.isUser ? null : Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))
                          ],
                        ),
                        child: Text(
                          msg.text,
                          style: TextStyle(
                            color: msg.isUser ? Colors.white : const Color(0xFF1E293B),
                            fontSize: 15,
                          ),
                        ),
                      ).animate().fade(duration: 300.ms).slideY(begin: 0.2, end: 0, curve: Curves.easeOutQuad),
                    );
                  },
                ),
              ),
              if (_chatViewModel.isTyping)
                Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(left: 16, bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16).copyWith(bottomLeft: const Radius.circular(0)),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const CircleAvatar(radius: 4, backgroundColor: Color(0xFF047857)).animate(onPlay: (controller) => controller.repeat()).fade(duration: 400.ms).then().fade(duration: 400.ms, begin: 1, end: 0.2),
                        const SizedBox(width: 4),
                        const CircleAvatar(radius: 4, backgroundColor: Color(0xFF047857)).animate(delay: 200.ms, onPlay: (controller) => controller.repeat()).fade(duration: 400.ms).then().fade(duration: 400.ms, begin: 1, end: 0.2),
                        const SizedBox(width: 4),
                        const CircleAvatar(radius: 4, backgroundColor: Color(0xFF047857)).animate(delay: 400.ms, onPlay: (controller) => controller.repeat()).fade(duration: 400.ms).then().fade(duration: 400.ms, begin: 1, end: 0.2),
                      ],
                    ),
                  ).animate().fade().slideY(begin: 0.2, end: 0),
                ),
              _buildInputArea(),
            ],
          );
        },
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, -2))],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _textController,
              decoration: InputDecoration(
                hintText: 'Tanya Jana...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              onSubmitted: (_) => _handleSendMessage(),
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: const Color(0xFF047857),
            radius: 24,
            child: IconButton(
              icon: const Icon(LucideIcons.send, color: Colors.white, size: 20),
              onPressed: _chatViewModel.isTyping ? null : _handleSendMessage,
            ),
          ),
        ],
      ),
    );
  }
}
