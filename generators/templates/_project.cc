#include "<%= main_header_path %>"
#include <sstream>

namespace <%= namespace %> {
<%_ switch(standard) {
    case `03`:
    case `11`: -%>
  std::string GetVersion();
<%_    break;
    default: -%>
  auto GetVersion() -> std::string {
   <%_ break;
} -%>
    std::stringstream ss;
    ss << <%= header_prefix %>_VERSION_MAJOR << ".";
    ss << <%= header_prefix %>_VERSION_MINOR << ".";
    ss << <%= header_prefix %>_VERSION_PATCH;
    return ss.str();
  }
}