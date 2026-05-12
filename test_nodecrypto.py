# test_nodecrypto.py
"""
Tests for NodeCrypto module.
"""

import unittest
from nodecrypto import NodeCrypto

class TestNodeCrypto(unittest.TestCase):
    """Test cases for NodeCrypto class."""
    
    def test_initialization(self):
        """Test class initialization."""
        instance = NodeCrypto()
        self.assertIsInstance(instance, NodeCrypto)
        
    def test_run_method(self):
        """Test the run method."""
        instance = NodeCrypto()
        self.assertTrue(instance.run())

if __name__ == "__main__":
    unittest.main()
